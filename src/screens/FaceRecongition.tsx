import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCameraFormat,
  PhotoFile,
  CameraCaptureError,
} from 'react-native-vision-camera';
import FaceDetection, { Face } from '@react-native-ml-kit/face-detection';
import { useDispatch, useSelector } from 'react-redux';
import { setEnrolledImage, clearEnrolledImage } from '../redux/faceEnrollmentSlice';
import { RootState } from '../redux/store';
import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';
import FaceFrameOverlay from '../components/FaceFrameOverlay';
import FaceStatusBadge from '../components/FaceStatusBadge';
import FaceCheckList from '../components/FaceCheckList';
import FaceCaptureButton from '../components/FaceCaptureButton';
import FacePreviewCard from '../components/FacePreviewCard';
import FaceEnrollmentDialog, { FaceReplaceDialog } from '../components/FaceEnrollmentDialog';
import { colors } from '../common/colors';
import CommonAlertModal from '../components/CommonAlertModal';

const { height } = Dimensions.get('window');
const TARGET_FPS = 30;

const FaceRecognition = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const existingEnrolledImage = useSelector((state: RootState) => state.faceEnrollment.enrolledImageBase64);

  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [detectedFaces, setDetectedFaces] = useState<Face[]>([]);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<string>('');
  const [isValidFace, setIsValidFace] = useState(false);
  const [showCaptureButton, setShowCaptureButton] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const device = useCameraDevice('front');
  const { hasPermission: cameraPermission, requestPermission } = useCameraPermission();

  const format = useCameraFormat(device, [{ fps: TARGET_FPS }]);

  const cameraRef = useRef<Camera>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const frameAnim = useRef(new Animated.Value(0)).current;
  const statusBounceAnim = useRef(new Animated.Value(1)).current;
  const checklistAnim = useRef(new Animated.Value(0)).current;
  const cornerRotateAnim = useRef(new Animated.Value(0)).current;
  const captureButtonAnim = useRef(new Animated.Value(0)).current;
  const dialogScaleAnim = useRef(new Animated.Value(0)).current;
  const dialogOpacityAnim = useRef(new Animated.Value(0)).current;
  const successPulseAnim = useRef(new Animated.Value(1)).current;

  const autoCaptureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  const checkPermissions = useCallback(async () => {
    if (cameraPermission) {
      setHasPermission(true);
    } else {
      const permission = await requestPermission();
      setHasPermission(permission);
      if (!permission) {
        setAlertModal({
          visible: true,
          title: 'Camera Permission',
          message: 'Camera permission is required for face detection',
        });
      }
    }
  }, [cameraPermission, requestPermission]);

  const validateFace = useCallback((
    face: Face,
  ): { valid: boolean; message: string; canCapture: boolean } => {
    const EYE_OPEN_THRESHOLD = 0.5;
    const MIN_FACE_SIZE = 60;
    const MAX_ROTATION = 30;
    const IMAGE_WIDTH = 640;
    const IMAGE_HEIGHT = 480;
    const CENTER_TOLERANCE_PERCENT = 0.05;

    const leftEyeOpen = face.leftEyeOpenProbability || 0;
    const rightEyeOpen = face.rightEyeOpenProbability || 0;
    const eyesOpen = leftEyeOpen >= EYE_OPEN_THRESHOLD && rightEyeOpen >= EYE_OPEN_THRESHOLD;

    if (!eyesOpen) {
      return { valid: false, message: `Open your eyes`, canCapture: false };
    }

    const faceCleared = face.frame.width >= MIN_FACE_SIZE && face.frame.height >= MIN_FACE_SIZE;

    if (!faceCleared) {
      return { valid: false, message: `Move closer`, canCapture: false };
    }

    if (Math.abs(face.rotationY) > MAX_ROTATION || Math.abs(face.rotationZ) > MAX_ROTATION) {
      return { valid: false, message: `Keep head straight`, canCapture: false };
    }

    const faceCenterX = face.frame.left + face.frame.width / 2;
    const faceCenterY = face.frame.top + face.frame.height / 2;

    const isInHorizontalCenter =
      faceCenterX > IMAGE_WIDTH * CENTER_TOLERANCE_PERCENT &&
      faceCenterX < IMAGE_WIDTH * (1 - CENTER_TOLERANCE_PERCENT);
    const isInVerticalCenter =
      faceCenterY > IMAGE_HEIGHT * CENTER_TOLERANCE_PERCENT &&
      faceCenterY < IMAGE_HEIGHT * (1 - CENTER_TOLERANCE_PERCENT);

    if (!isInHorizontalCenter || !isInVerticalCenter) {
      return { valid: false, message: `Center your face`, canCapture: true };
    }

    return {
      valid: true,
      message: 'Perfect! Waiting for auto-capture...',
      canCapture: true,
    };
  }, []);

  const captureIfValid = useCallback((photoPath: string) => {
    if (!isActive || capturedImage || !isValidFace) return;

    setCapturedImage(`file://${photoPath}`);
    setIsActive(false);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 12, bounciness: 8, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(checkmarkAnim, { toValue: 1, speed: 10, bounciness: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, [isActive, capturedImage, isValidFace, fadeAnim, slideAnim, checkmarkAnim]);

  const processAndValidateFace = useCallback(async (photoPath: string) => {
    if (capturedImage || !isActive) return;

    try {
      const faces = await FaceDetection.detect(`file://${photoPath}`, {
        performanceMode: 'fast',
        classificationMode: 'all',
        landmarkMode: 'none',
        contourMode: 'none',
      });

      setDetectedFaces(faces);
      const detected = faces.length > 0;
      setIsFaceDetected(detected);

      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
        autoCaptureTimeoutRef.current = null;
      }
      setIsValidFace(false);

      if (faces.length === 0) {
        setValidationStatus('No face detected');
        setShowCaptureButton(false);
      } else if (faces.length > 1) {
        setValidationStatus('Multiple faces detected');
        setShowCaptureButton(false);
      } else {
        const face = faces[0];
        const validation = validateFace(face);

        setValidationStatus(validation.message);
        setShowCaptureButton(validation.canCapture);

        if (validation.valid) {
          setIsValidFace(true);
          autoCaptureTimeoutRef.current = setTimeout(() => {
            captureIfValid(photoPath);
          }, 1500);
        }
      }
    } catch {
      setValidationStatus('Detection error');
      setShowCaptureButton(false);
    }
  }, [isActive, capturedImage, validateFace, captureIfValid]);

  const handleManualCapture = useCallback(async () => {
    if (!cameraRef.current || !isActive || capturedImage) return;

    try {
      isProcessingRef.current = true;
      setIsProcessing(true);

      const photo: PhotoFile = await cameraRef.current.takePhoto({ flash: 'off' });

      setIsValidFace(true);
      setCapturedImage(`file://${photo.path}`);
      setIsActive(false);
      setShowCaptureButton(false);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, speed: 12, bounciness: 8, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(300),
          Animated.spring(checkmarkAnim, { toValue: 1, speed: 10, bounciness: 10, useNativeDriver: true }),
        ]),
      ]).start();
    } catch (error) {
      setAlertModal({
        visible: true,
        title: 'Error',
        message: (error as CameraCaptureError).message || 'Failed to capture photo',
      });
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [isActive, capturedImage, fadeAnim, slideAnim, checkmarkAnim]);

  const handleRetake = useCallback(() => {
    if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
      autoCaptureTimeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }),
      Animated.timing(checkmarkAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCapturedImage(null);
      setIsValidFace(false);
      setValidationStatus('');
      setShowCaptureButton(false);
      setIsActive(true);
      setDetectedFaces([]);
      setIsFaceDetected(false);
    });
  }, [fadeAnim, slideAnim, checkmarkAnim]);

  const captureAndDetectFacePeriodic = useCallback(async () => {
    if (!cameraRef.current || isProcessingRef.current || !isActive || capturedImage) return;

    try {
      isProcessingRef.current = true;

      const photo: PhotoFile = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      await processAndValidateFace(photo.path);
    } catch (error) {

    } finally {
      isProcessingRef.current = false;
    }
  }, [isActive, capturedImage, processAndValidateFace]);

  const proceedWithEnrollment = useCallback(() => {
    setShowEnrollDialog(true);
    setShowReplaceDialog(false);
    Animated.parallel([
      Animated.spring(dialogScaleAnim, { toValue: 1, speed: 12, bounciness: 10, useNativeDriver: true }),
      Animated.timing(dialogOpacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(successPulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(successPulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, [dialogScaleAnim, dialogOpacityAnim, successPulseAnim]);

  const handleEnrollFace = useCallback(() => {
    if (existingEnrolledImage) {
      setShowReplaceDialog(true);
      Animated.parallel([
        Animated.spring(dialogScaleAnim, { toValue: 1, speed: 12, bounciness: 10, useNativeDriver: true }),
        Animated.timing(dialogOpacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      proceedWithEnrollment();
    }
  }, [existingEnrolledImage, dialogScaleAnim, dialogOpacityAnim, proceedWithEnrollment]);

  const handleReplaceImage = useCallback(() => {
    dispatch(clearEnrolledImage());
    proceedWithEnrollment();
  }, [dispatch, proceedWithEnrollment]);

  const handleUseExistingImage = useCallback(() => {
    Animated.parallel([
      Animated.timing(dialogScaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(dialogOpacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowReplaceDialog(false);
      handleRetake();
    });
  }, [dialogScaleAnim, dialogOpacityAnim, handleRetake]);

  const handleDialogOk = useCallback(async () => {
    try {
      if (capturedImage) {
        const imagePath = capturedImage.replace('file://', '');
        const base64String = await RNFS.readFile(imagePath, 'base64');
        dispatch(setEnrolledImage(base64String));
      }
    } catch (error) {
      setAlertModal({
        visible: true,
        title: 'Error',
        message: 'Failed to save the face image',
      });
      return;
    }

    Animated.parallel([
      Animated.timing(dialogScaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(dialogOpacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowEnrollDialog(false);
      successPulseAnim.stopAnimation();
      successPulseAnim.setValue(1);
      navigation.goBack();
    });
  }, [capturedImage, dispatch, dialogScaleAnim, dialogOpacityAnim, successPulseAnim, navigation]);

  const handleAlertModalClose = useCallback(() => {
    setAlertModal({
      visible: false,
      title: '',
      message: '',
    });
  }, []);

  useEffect(() => {
    checkPermissions();

    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(frameAnim, { toValue: 1, speed: 8, bounciness: 10, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerRotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(cornerRotateAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();

    return () => {
      if (autoCaptureTimeoutRef.current) clearTimeout(autoCaptureTimeoutRef.current);
    };
  }, [checkPermissions]);

  useEffect(() => {
    if (isFaceDetected) {
      Animated.sequence([
        Animated.spring(statusBounceAnim, { toValue: 1.1, speed: 20, bounciness: 15, useNativeDriver: true }),
        Animated.spring(statusBounceAnim, { toValue: 1, speed: 20, bounciness: 15, useNativeDriver: true }),
      ]).start();

      Animated.spring(checklistAnim, { toValue: 1, speed: 10, bounciness: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(checklistAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }

    if (!isFaceDetected) {
      setShowCaptureButton(false);
      setIsValidFace(false);
      Animated.timing(captureButtonAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start();
    } else if (showCaptureButton) {
      Animated.spring(captureButtonAnim, { toValue: 1, speed: 15, bounciness: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(captureButtonAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start();
    }
  }, [isFaceDetected, showCaptureButton]);

  useEffect(() => {
    if (hasPermission && isActive && !capturedImage && !isProcessingRef.current) {
      const interval = setInterval(() => {
        captureAndDetectFacePeriodic();
      }, 500);

      return () => {
        clearInterval(interval);
        if (autoCaptureTimeoutRef.current) clearTimeout(autoCaptureTimeoutRef.current);
      };
    }
  }, [hasPermission, isActive, capturedImage, captureAndDetectFacePeriodic]);

  const detectedFace = useMemo(() => {
    return isFaceDetected && detectedFaces.length === 1 ? detectedFaces[0] : null;
  }, [isFaceDetected, detectedFaces]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!capturedImage && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          photo={true}
          format={format}
        />
      )}

      {capturedImage && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        </Animated.View>
      )}

      {!capturedImage && (
        <>
          <FaceFrameOverlay
            headerAnim={headerAnim}
            pulseAnim={pulseAnim}
            frameAnim={frameAnim}
            cornerRotateAnim={cornerRotateAnim}
            isValidFace={isValidFace}
          />
          <FaceStatusBadge
            validationStatus={validationStatus}
            isValidFace={isValidFace}
            isFaceDetected={isFaceDetected}
            statusBounceAnim={statusBounceAnim}
          />
          {detectedFace && (
            <FaceCheckList detectedFace={detectedFace} checklistAnim={checklistAnim} />
          )}
        </>
      )}

      {!capturedImage && showCaptureButton && (
        <FaceCaptureButton
          onPress={handleManualCapture}
          isProcessing={isProcessing}
          captureButtonAnim={captureButtonAnim}
          showCaptureButton={showCaptureButton}
        />
      )}

      {capturedImage && (
        <FacePreviewCard
          capturedImage={capturedImage}
          slideAnim={slideAnim}
          checkmarkAnim={checkmarkAnim}
          onRetake={handleRetake}
          onEnroll={handleEnrollFace}
        />
      )}

      <FaceEnrollmentDialog
        showEnrollDialog={showEnrollDialog}
        dialogScaleAnim={dialogScaleAnim}
        dialogOpacityAnim={dialogOpacityAnim}
        successPulseAnim={successPulseAnim}
        onOk={handleDialogOk}
      />

      <FaceReplaceDialog
        showReplaceDialog={showReplaceDialog}
        dialogScaleAnim={dialogScaleAnim}
        dialogOpacityAnim={dialogOpacityAnim}
        existingEnrolledImage={existingEnrolledImage}
        onUseExisting={handleUseExistingImage}
        onReplace={handleReplaceImage}
      />

      <CommonAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={handleAlertModalClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Sen-Regular',
    color: colors.white,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Sen-SemiBold',
    color: colors.white,
    textAlign: 'center',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default FaceRecognition;
