import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSelector, useDispatch} from 'react-redux';
import Tech5Finger, {
  CaptureResult,
  FingerData,
  CaptureConfig,
  SegmentationMode,
} from '../modules/Tech5Finger';
import {RootState} from '../redux/store';
import {
  setFingerCapture,
  selectAllFingersEnrolled,
  selectMissingCaptures,
  selectFingerTemplates,
  selectFingerTemplatesForApi,
  CaptureMode,
  FingerCaptureData,
  clearFingerEnrollment,
  setFingerTemplatesFromCapture,
} from '../redux/fingerEnrollmentSlice';
import { setUserEnrolled, resetUserEnrollment } from '../redux/userEnrollmentSlice';
import apiService from '../services/api.service';
import ApiResponseDialog from '../components/ApiResponseDialog';
import CommonAlertModal from '../components/CommonAlertModal';
import EnrollmentRequiredModal from '../components/EnrollmentRequiredModal';

interface FingerCaptureScreenProps {
  navigation?: any;
  route?: {
    params?: {
      config?: CaptureConfig;
      onCaptureComplete?: (result: CaptureResult) => void;
    };
  };
  onProceedToNext?: () => void;
}

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const FONTS = {
  bold: 'Sen-Bold',
  semiBold: 'Sen-SemiBold',
  regular: 'Sen-Regular',
  medium: 'Sen-Medium',
};

const FingerCaptureScreen: React.FC<FingerCaptureScreenProps> = ({
  navigation,
  route,
  onProceedToNext,
}) => {
  const dispatch = useDispatch();
  const fingerEnrollment = useSelector(
    (state: RootState) => state.fingerEnrollment,
  );
  const allFingersEnrolled = useSelector(selectAllFingersEnrolled);
  const missingCaptures = useSelector(selectMissingCaptures);
  const fingerTemplates = useSelector(selectFingerTemplates);
  const fingerTemplatesForApi = useSelector(selectFingerTemplatesForApi);

  // Get face enrolled image and scan data for API calls
  const existingEnrolledImage = useSelector((state: RootState) => state.faceEnrollment.enrolledImageBase64) as string | null;
  const scanData = useSelector((state: RootState) => state.scan.scans[0]);

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<CaptureMode>('left_slap');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEnrollmentRequiredModal, setShowEnrollmentRequiredModal] = useState(false);
  const [apiResponse, setApiResponse] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    visible: false,
    type: 'success',
    message: '',
  });
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });
  const [showLowQualityModal, setShowLowQualityModal] = useState(false);
  const [lowQualityFingers, setLowQualityFingers] = useState<FingerData[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const resetModalAnim = useRef(new Animated.Value(0)).current;
  const incompleteModalAnim = useRef(new Animated.Value(0)).current;
  const lowQualityModalAnim = useRef(new Animated.Value(0)).current;

  const captureConfig = route?.params?.config || {};
  const onCaptureComplete = route?.params?.onCaptureComplete;

  const enrolledCount = [
    fingerEnrollment.leftSlap,
    fingerEnrollment.leftThumb,
    fingerEnrollment.rightSlap,
    fingerEnrollment.rightThumb,
  ].filter(Boolean).length;

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: enrolledCount / 4,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [enrolledCount]);

  // Pulse animation for capture button
  useEffect(() => {
    // Check if the selected mode is already captured
    const isModeCaptured = (): boolean => {
      switch (selectedMode) {
        case 'left_slap':
          return !!fingerEnrollment.leftSlap;
        case 'left_thumb':
          return !!fingerEnrollment.leftThumb;
        case 'right_slap':
          return !!fingerEnrollment.rightSlap;
        case 'right_thumb':
          return !!fingerEnrollment.rightThumb;
        default:
          return false;
      }
    };

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    if (!isCapturing && !isModeCaptured()) {
      pulse.start();
    }
    return () => pulse.stop();
  }, [isCapturing, selectedMode, fingerEnrollment]);

  // Modal animation
  useEffect(() => {
    if (showConfirmModal) {
      Animated.spring(modalAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      modalAnim.setValue(0);
    }
  }, [showConfirmModal]);

  // Reset modal animation
  useEffect(() => {
    if (showResetModal) {
      Animated.spring(resetModalAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      resetModalAnim.setValue(0);
    }
  }, [showResetModal]);

  // Incomplete modal animation
  useEffect(() => {
    if (showIncompleteModal) {
      Animated.spring(incompleteModalAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      incompleteModalAnim.setValue(0);
    }
  }, [showIncompleteModal]);

  // Low quality modal animation
  useEffect(() => {
    if (showLowQualityModal) {
      Animated.spring(lowQualityModalAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      lowQualityModalAnim.setValue(0);
    }
  }, [showLowQualityModal]);

  // Helper function to check if a finger has low quality (below 30 or N/A)
  const checkLowQualityFingers = useCallback((fingers: FingerData[]): FingerData[] => {
    return fingers.filter(finger => {
      const quality = finger.quality;
      // Check if quality is undefined, null, or below 30
      if (quality === undefined || quality === null) {
        return true; // N/A case
      }
      if (typeof quality === 'number' && quality < 30) {
        return true; // Below 30 case
      }
      return false;
    });
  }, []);

  const handleCapture = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Error', 'Fingerprint capture is only available on Android');
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      console.log('[FingerCapture] Starting capture for mode:', selectedMode);

      const hasPermission = await Tech5Finger.checkCameraPermission();
      if (!hasPermission) {
        const granted = await Tech5Finger.requestCameraPermission();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Camera permission is required for fingerprint capture',
          );
          setIsCapturing(false);
          return;
        }
      }

      let result: CaptureResult;
      let title: string;
      let segmentationMode: SegmentationMode;

      switch (selectedMode) {
        case 'left_slap':
          title = 'Left Slap Capture';
          segmentationMode = 'LEFT_SLAP';
          break;
        case 'left_thumb':
          title = 'Left Thumb Capture';
          segmentationMode = 'LEFT_THUMB';
          break;
        case 'right_slap':
          title = 'Right Slap Capture';
          segmentationMode = 'RIGHT_SLAP';
          break;
        case 'right_thumb':
          title = 'Right Thumb Capture';
          segmentationMode = 'RIGHT_THUMB';
          break;
      }

      result = await Tech5Finger.captureFingers({
        ...captureConfig,
        segmentationModes: [segmentationMode],
        title,
        livenessCheck: true,
        getQuality: true,
        getNfiq2Quality: false,
      });

      // Log the complete capture result format
      console.log('[FingerCapture] ========== CAPTURE RESULT FORMAT ==========');
      console.log('[FingerCapture] Mode:', selectedMode);
      console.log('[FingerCapture] Success:', result.success);
      console.log('[FingerCapture] Total Fingers Captured:', result.fingers?.length || 0);

      if (result.fingers && result.fingers.length > 0) {
        console.log('[FingerCapture] ----- FINGER DATA DETAILS -----',);
        result.fingers.forEach((finger, index) => {
          console.log(`[FingerCapture] Finger ${index + 1}:`);
          console.log(`  - Position Code: ${finger.position}`);
          console.log(`  - Position Name: ${Tech5Finger.getFingerName(finger.position)}`);
          console.log(`  - Quality: ${finger.quality}`);
          console.log(`  - NIST Quality: ${finger.nistQuality}`);
          console.log(`  - NIST2 Quality: ${finger.nist2Quality}`);
          console.log(`  - Minutiaes Number: ${finger.minutiaesNumber}`);
          console.log(`  - Primary Image Type: ${finger.primaryImageType}`);
          console.log(`  - Primary Image Base64 Length: ${finger.primaryImageBase64?.length || 0} chars`);
          console.log(`  - Primary Image Base64 (first 100 chars): ${finger.primaryImageBase64?.substring(0, 100)}...`);
          console.log(`  - Display Image Type: ${finger.displayImageType || 'N/A'}`);
          console.log(`  - Display Image Base64 Length: ${finger.displayImageBase64?.length || 0} chars`);
        });
      }

      if (result.slapImages && result.slapImages.length > 0) {
        console.log('[FingerCapture] ----- SLAP IMAGES -----');
        result.slapImages.forEach((slap, index) => {
          console.log(`[FingerCapture] Slap Image ${index + 1}:`);
          console.log(`  - Position: ${slap.position}`);
          console.log(`  - Image Type: ${slap.imageType}`);
          console.log(`  - Image Base64 Length: ${slap.imageBase64?.length || 0} chars`);
        });
      }

      if (result.livenessScores && result.livenessScores.length > 0) {
        console.log('[FingerCapture] ----- LIVENESS SCORES -----');
        result.livenessScores.forEach((liveness, index) => {
          console.log(`[FingerCapture] Liveness ${index + 1}:`);
          console.log(`  - Position Code: ${liveness.positionCode}`);
          console.log(`  - Score: ${liveness.score}`);
        });
      }

      console.log('[FingerCapture] ----- RAW RESULT OBJECT -----');
      console.log('[FingerCapture] Full Result:', JSON.stringify(result, null, 2));
      console.log('[FingerCapture] =============================================');

      const captureData: FingerCaptureData = {
        fingers: result.fingers || [],
        capturedAt: new Date().toISOString(),
        livenessScores: result.livenessScores,
      };

      dispatch(setFingerCapture({mode: selectedMode, data: captureData}));

      // Store individual finger templates with title and base64
      if (result.fingers && result.fingers.length > 0) {
        dispatch(setFingerTemplatesFromCapture(result.fingers));

        // Check for low quality fingers
        const lowQuality = checkLowQualityFingers(result.fingers);
        if (lowQuality.length > 0) {
          setLowQualityFingers(lowQuality);
          setShowLowQualityModal(true);
        }
      }

      console.log('[FingerCapture] Capture successful for:', selectedMode);
    } catch (err: any) {
      console.log('[FingerCapture] Error:', err);
      const errorMessage = err.message || 'Failed to capture fingerprints';
      setError(errorMessage);

      if (err.code !== 'CANCELLED') {
        Alert.alert('Capture Error', errorMessage);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [selectedMode, captureConfig, dispatch, checkLowQualityFingers]);

  const handleContinue = useCallback(() => {
    if (!allFingersEnrolled) {
      setShowIncompleteModal(true);
      return;
    }

    // Log stored finger templates data
    console.log('[FingerCapture] ========== STORED FINGER TEMPLATES ==========');
    console.log('[FingerCapture] Full Templates:', JSON.stringify(fingerTemplates, null, 2));
    console.log('[FingerCapture] Templates for API:', JSON.stringify(fingerTemplatesForApi, null, 2));
    console.log('[FingerCapture] =============================================');

    setShowConfirmModal(true);
  }, [allFingersEnrolled, fingerTemplates, fingerTemplatesForApi]);

  const handleConfirmProceed = useCallback(async () => {
    // Validate face enrollment
    if (!existingEnrolledImage) {
      setShowConfirmModal(false);
      setShowEnrollmentRequiredModal(true);
      return;
    }

    // Validate scan data
    if (!scanData) {
      setShowConfirmModal(false);
      setAlertModal({
        visible: true,
        title: 'Error',
        message: 'No scan data found. Please complete document scanning first.',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Parse scanned JSON
      let parsedScannedJson;
      try {
        parsedScannedJson = typeof scanData.scanned_json === 'string'
          ? JSON.parse(scanData.scanned_json)
          : scanData.scanned_json;
      } catch (e) {
        parsedScannedJson = [];
      }

      let scannedJsonObject: Record<string, any> = {};
      if (Array.isArray(parsedScannedJson)) {
        parsedScannedJson.forEach((item: any) => {
          if (item.name && item.value !== undefined) {
            scannedJsonObject[item.name] = item.value;
          }
        });
      } else if (typeof parsedScannedJson === 'object') {
        scannedJsonObject = parsedScannedJson;
      }

      // Clean name
      let cleanedName = scanData.Name || '';
      if (cleanedName.startsWith('Name\n')) {
        cleanedName = cleanedName.replace('Name\n', '').trim();
      } else if (cleanedName.startsWith('Name')) {
        cleanedName = cleanedName.replace('Name', '').trim();
      }

      // First API call - User Registration
      const apiRequestBody = {
        center_code: scanData.Centre_Code,
        document_image: scanData.Document_Image,
        name: cleanedName,
        portrait_image: scanData.Portrait_Image,
        registration_id: scanData.Registration_Number,
        scanned_json: scannedJsonObject,
      };

      await apiService.post('/users/', apiRequestBody);

      // Second API call - Biometric Enrollment
      const templateEnrollmentBody = {
        biometric_data: {
          biometrics: {
            face: existingEnrolledImage,
            fingerprints: fingerTemplatesForApi,
          },
        },
        registration_id: scanData.Registration_Number,
      };

      console.log('biometric_data request body:', JSON.stringify(templateEnrollmentBody, null, 2));

      await apiService.post('/biometric/enroll', templateEnrollmentBody);

      // Clear existing enrollment status first, then set new value
      dispatch(resetUserEnrollment());
      dispatch(setUserEnrolled(true));

      // Close the confirmation modal after successful API calls
      setShowConfirmModal(false);

      // Call onCaptureComplete if provided (for standalone navigation use)
      if (onCaptureComplete && fingerEnrollment) {
        const allFingers: FingerData[] = [
          ...(fingerEnrollment.leftSlap?.fingers || []),
          ...(fingerEnrollment.leftThumb?.fingers || []),
          ...(fingerEnrollment.rightSlap?.fingers || []),
          ...(fingerEnrollment.rightThumb?.fingers || []),
        ];
        onCaptureComplete({fingers: allFingers, success: true} as CaptureResult);
      }

      // Move to Success step in Dashboard (step 3)
      if (onProceedToNext) {
        onProceedToNext();
      } else if (navigation) {
        navigation.goBack();
      }
    } catch (error: any) {
      // Close the confirmation modal on error
      setShowConfirmModal(false);

      let errorMessage = 'Network error. Please check your connection and try again.';

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setApiResponse({
        visible: true,
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [fingerEnrollment, onCaptureComplete, navigation, existingEnrolledImage, scanData, fingerTemplatesForApi, onProceedToNext, dispatch]);

  const handleReset = useCallback(() => {
    setShowResetModal(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    dispatch(clearFingerEnrollment());
    setShowResetModal(false);
  }, [dispatch]);

  const closeEnrollmentRequiredModal = useCallback(() => {
    setShowEnrollmentRequiredModal(false);
  }, []);

  const handleApiResponseClose = useCallback(() => {
    setApiResponse({
      visible: false,
      type: 'success',
      message: '',
    });
  }, []);

  const handleAlertModalClose = useCallback(() => {
    setAlertModal({
      visible: false,
      title: '',
      message: '',
    });
  }, []);

  const getModeLabel = (mode: CaptureMode): string => {
    switch (mode) {
      case 'left_slap':
        return 'Left Slap';
      case 'left_thumb':
        return 'Left Thumb';
      case 'right_slap':
        return 'Right Slap';
      case 'right_thumb':
        return 'Right Thumb';
      default:
        return mode;
    }
  };

  const isCaptured = (mode: CaptureMode): boolean => {
    switch (mode) {
      case 'left_slap':
        return !!fingerEnrollment.leftSlap;
      case 'left_thumb':
        return !!fingerEnrollment.leftThumb;
      case 'right_slap':
        return !!fingerEnrollment.rightSlap;
      case 'right_thumb':
        return !!fingerEnrollment.rightThumb;
      default:
        return false;
    }
  };

  const getCaptureData = (mode: CaptureMode): FingerCaptureData | null => {
    switch (mode) {
      case 'left_slap':
        return fingerEnrollment.leftSlap;
      case 'left_thumb':
        return fingerEnrollment.leftThumb;
      case 'right_slap':
        return fingerEnrollment.rightSlap;
      case 'right_thumb':
        return fingerEnrollment.rightThumb;
      default:
        return null;
    }
  };

  const renderFingerImage = (finger: FingerData, small = false) => {
    const imageUri = Tech5Finger.toImageUri(
      finger.primaryImageBase64,
      finger.primaryImageType,
    );

    return (
      <Animated.View
        key={finger.position}
        style={[
          small ? styles.fingerCardSmall : styles.fingerCard,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <Image
          source={{uri: imageUri}}
          style={small ? styles.fingerImageSmall : styles.fingerImage}
        />
        <Text style={small ? styles.fingerNameSmall : styles.fingerName}>
          {Tech5Finger.getFingerName(finger.position)}
        </Text>
        {!small && (
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityBadgeText}>
              {finger.quality || 'N/A'}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderModeButton = (mode: CaptureMode, index: number) => {
    const captured = isCaptured(mode);
    const isSelected = selectedMode === mode;

    return (
      <Animated.View
        key={mode}
        style={{
          opacity: fadeAnim,
          transform: [
            {translateY: slideAnim},
            {
              scale: isSelected ? 1.02 : 1,
            },
          ],
        }}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            isSelected && styles.modeButtonActive,
            captured && !isSelected && styles.modeButtonCaptured,
          ]}
          onPress={() => setSelectedMode(mode)}
          activeOpacity={0.8}>
          <View style={styles.modeButtonContent}>
            <View style={styles.modeIconContainer}>
              {captured ? (
                <View style={styles.checkCircle}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.modeNumber,
                    isSelected && styles.modeNumberActive,
                  ]}>
                  <Text
                    style={[
                      styles.modeNumberText,
                      isSelected && styles.modeNumberTextActive,
                    ]}>
                    {index + 1}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.modeButtonText,
                isSelected && styles.modeButtonTextActive,
                captured && !isSelected && styles.modeButtonTextCaptured,
              ]}>
              {getModeLabel(mode)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderProgressBar = () => {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Enrollment Progress</Text>
          <Text style={styles.progressCount}>{enrolledCount}/4</Text>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[styles.progressBarFill, {width: progressWidth}]}
          />
        </View>
        <View style={styles.progressDots}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < enrolledCount && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderCurrentCapture = () => {
    const captureData = getCaptureData(selectedMode);
    if (!captureData || !captureData.fingers.length) {
      return (
        <Animated.View
          style={[
            styles.emptyCapture,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <View style={styles.emptyCaptureIcon}>
            <Text style={styles.emptyCaptureIconText}>👆</Text>
          </View>
          <Text style={styles.emptyCaptureText}>
            No capture yet for {getModeLabel(selectedMode)}
          </Text>
          <Text style={styles.emptyCaptureSubtext}>
            Tap the button below to start scanning
          </Text>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.resultsContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <View style={styles.resultsHeader}>
          <View style={styles.resultsBadge}>
            <Text style={styles.resultsBadgeText}>✓ Captured</Text>
          </View>
          <Text style={styles.resultsTitle}>{getModeLabel(selectedMode)}</Text>
          <Text style={styles.resultsSubtitle}>
            {captureData.fingers.length} finger(s) detected
          </Text>
        </View>
        <View style={styles.fingersGrid}>
          {captureData.fingers.map(finger => renderFingerImage(finger))}
        </View>
      </Animated.View>
    );
  };

  const renderConfirmationModal = () => {
    const leftFingers = [
      ...(fingerEnrollment.leftSlap?.fingers || []),
      ...(fingerEnrollment.leftThumb?.fingers || []),
    ];
    const rightFingers = [
      ...(fingerEnrollment.rightSlap?.fingers || []),
      ...(fingerEnrollment.rightThumb?.fingers || []),
    ];

    const modalScale = modalAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    });

    return (
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalAnim,
                transform: [{scale: modalScale}],
              },
            ]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <Text style={styles.modalIcon}>🔐</Text>
              </View>
              <Text style={styles.modalTitle}>Confirm Fingerprints</Text>
              <Text style={styles.modalSubtitle}>
                Review all captured fingerprints before proceeding
              </Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}>
              {/* Left Hand Section */}
              <View style={styles.handSection}>
                <View style={styles.handHeader}>
                  <Text style={styles.handEmoji}>🤚</Text>
                  <Text style={styles.handLabel}>Left Hand</Text>
                  <Text style={styles.handCount}>
                    {leftFingers.length} fingers
                  </Text>
                </View>
                <View style={styles.handFingersRow}>
                  {leftFingers.map(finger => renderFingerImage(finger, true))}
                </View>
              </View>

              {/* Right Hand Section */}
              <View style={styles.handSection}>
                <View style={styles.handHeader}>
                  <Text style={styles.handEmoji}>✋</Text>
                  <Text style={styles.handLabel}>Right Hand</Text>
                  <Text style={styles.handCount}>
                    {rightFingers.length} fingers
                  </Text>
                </View>
                <View style={styles.handFingersRow}>
                  {rightFingers.map(finger => renderFingerImage(finger, true))}
                </View>
              </View>
            </ScrollView>

            {/* Confirmation Text */}
            <View style={styles.confirmSection}>
              <Text style={styles.confirmText}>
                Do you want to proceed with these fingerprints?
              </Text>
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.8}
                disabled={isSubmitting}>
                <Text style={styles.modalButtonCancelText}>Re-capture</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonConfirm, isSubmitting && {opacity: 0.7}]}
                onPress={handleConfirmProceed}
                activeOpacity={0.8}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.modalButtonConfirmText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalButtonConfirmText}>
                    Confirm & Proceed
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>🖐️</Text>
          </View>
          <Text style={styles.title}>Fingerprint Capture</Text>
          <Text style={styles.subtitle}>Mantra Finger Scanner</Text>
        </Animated.View>

        {renderProgressBar()}

        <View style={styles.modeContainer}>
          <Text style={styles.sectionTitle}>Select Capture Mode</Text>
          <View style={styles.modeButtons}>
            {(['left_slap', 'left_thumb', 'right_slap', 'right_thumb'] as const).map(
              (mode, index) => renderModeButton(mode, index),
            )}
          </View>
        </View>

        {/* Capture Button */}
        <Animated.View
          style={{
            transform: [{scale: isCapturing ? 1 : pulseAnim}],
          }}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isCapturing && styles.captureButtonDisabled,
              isCaptured(selectedMode) && styles.captureButtonRecapture,
            ]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.85}>
            {isCapturing ? (
              <View style={styles.captureButtonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.captureButtonText}>Scanning...</Text>
              </View>
            ) : (
              <View style={styles.captureButtonContent}>
                <Text style={styles.captureButtonIcon}>
                  {isCaptured(selectedMode) ? '🔄' : '📷'}
                </Text>
                <Text style={styles.captureButtonText}>
                  {isCaptured(selectedMode) ? 'Re-capture' : 'Start Capture'}
                </Text>
                <Text style={styles.captureButtonSubtext}>
                  {getModeLabel(selectedMode)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Error Display */}
        {error && (
          <Animated.View
            style={[
              styles.errorContainer,
              {
                opacity: fadeAnim,
              },
            ]}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Current Mode Results */}
        {renderCurrentCapture()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {enrolledCount > 0 && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.8}>
              <Text style={styles.resetButtonIcon}>🗑️</Text>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.continueButton,
              !allFingersEnrolled && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.85}>
            <Text style={styles.continueButtonText}>
              {allFingersEnrolled ? 'Continue' : `Complete All 4 Captures`}
            </Text>
            {allFingersEnrolled && (
              <Text style={styles.continueButtonIcon}>→</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderConfirmationModal()}

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: resetModalAnim,
                transform: [{scale: resetModalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })}],
              },
            ]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconCircle, {backgroundColor: '#FEE2E2'}]}>
                <Text style={styles.modalIcon}>🗑️</Text>
              </View>
              <Text style={styles.modalTitle}>Reset All Captures?</Text>
              <Text style={styles.modalSubtitle}>
                This will clear all captured fingerprints. You'll need to recapture all 4 modes.
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowResetModal(false)}
                activeOpacity={0.8}>
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonConfirm, {backgroundColor: '#DC2626'}]}
                onPress={handleConfirmReset}
                activeOpacity={0.8}>
                <Text style={styles.modalButtonConfirmText}>Reset All</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Incomplete Capture Modal */}
      <Modal
        visible={showIncompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIncompleteModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.incompleteModalContainer,
              {
                opacity: incompleteModalAnim,
                transform: [{scale: incompleteModalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })}],
              },
            ]}>
            <View style={styles.incompleteModalHeader}>
              <View style={styles.incompleteIconCircle}>
                <Text style={styles.incompleteIcon}>⚠️</Text>
              </View>
              <Text style={styles.incompleteModalTitle}>Incomplete Capture</Text>
              <Text style={styles.incompleteModalSubtitle}>
                Please complete all fingerprint captures before proceeding
              </Text>
            </View>

            <View style={styles.missingCapturesContainer}>
              <Text style={styles.missingCapturesLabel}>Missing Captures:</Text>
              <View style={styles.missingCapturesList}>
                {missingCaptures.map((mode, index) => (
                  <View key={mode} style={styles.missingCaptureItem}>
                    <View style={styles.missingCaptureNumber}>
                      <Text style={styles.missingCaptureNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.missingCaptureText}>{getModeLabel(mode)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.incompleteProgressContainer}>
              <View style={styles.incompleteProgressHeader}>
                <Text style={styles.incompleteProgressLabel}>Progress</Text>
                <Text style={styles.incompleteProgressCount}>{enrolledCount}/4 completed</Text>
              </View>
              <View style={styles.incompleteProgressBarBg}>
                <View style={[styles.incompleteProgressBarFill, {width: `${(enrolledCount / 4) * 100}%`}]} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.incompleteModalButton}
              onPress={() => setShowIncompleteModal(false)}
              activeOpacity={0.8}>
              <Text style={styles.incompleteModalButtonText}>Continue Capturing</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Low Quality Recapture Modal */}
      <Modal
        visible={showLowQualityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLowQualityModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.lowQualityModalContainer,
              {
                opacity: lowQualityModalAnim,
                transform: [{scale: lowQualityModalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })}],
              },
            ]}>
            <View style={styles.lowQualityModalHeader}>
              <View style={styles.lowQualityIconCircle}>
                <Text style={styles.lowQualityIcon}>!</Text>
              </View>
              <Text style={styles.lowQualityModalTitle}>Low Quality Detected</Text>
              <Text style={styles.lowQualityModalSubtitle}>
                {lowQualityFingers.length === 1
                  ? 'One finger has low quality. Please recapture for better results.'
                  : `${lowQualityFingers.length} fingers have low quality. Please recapture for better results.`}
              </Text>
            </View>

            <View style={styles.lowQualityFingersContainer}>
              <Text style={styles.lowQualityFingersLabel}>Affected Fingers:</Text>
              <View style={styles.lowQualityFingersList}>
                {lowQualityFingers.map((finger, index) => (
                  <View key={finger.position || index} style={styles.lowQualityFingerItem}>
                    <View style={styles.lowQualityFingerIcon}>
                      <Text style={styles.lowQualityFingerIconText}>👆</Text>
                    </View>
                    <View style={styles.lowQualityFingerInfo}>
                      <Text style={styles.lowQualityFingerName}>
                        {Tech5Finger.getFingerName(finger.position)}
                      </Text>
                      <Text style={styles.lowQualityFingerQuality}>
                        Quality: {finger.quality !== undefined && finger.quality !== null ? finger.quality : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.lowQualityBadge}>
                      <Text style={styles.lowQualityBadgeText}>Low</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.lowQualityModalButtons}>
              <TouchableOpacity
                style={styles.lowQualityButtonRecapture}
                onPress={() => {
                  setShowLowQualityModal(false);
                  handleCapture();
                }}
                activeOpacity={0.8}>
                <Text style={styles.lowQualityButtonRecaptureText}>Recapture</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Enrollment Required Modal */}
      <EnrollmentRequiredModal
        visible={showEnrollmentRequiredModal}
        onClose={closeEnrollmentRequiredModal}
      />

      {/* API Response Dialog */}
      <ApiResponseDialog
        visible={apiResponse.visible}
        type={apiResponse.type}
        message={apiResponse.message}
        onClose={handleApiResponseClose}
      />

      {/* Common Alert Modal */}
      <CommonAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={handleAlertModalClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'android' ? -30 : 0,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 0,
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  headerIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#64748B',
  },
  // Progress Styles
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#475569',
  },
  progressCount: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#6366F1',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  progressDotActive: {
    backgroundColor: '#22C55E',
  },
  // Section Title
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#334155',
    marginBottom: 8,
  },
  // Mode Selection Styles
  modeContainer: {
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  modeButton: {
    width: (SCREEN_WIDTH - 48) / 2,
    margin: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    elevation: 6,
  },
  modeButtonCaptured: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIconContainer: {
    marginRight: 10,
  },
  modeNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeNumberActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  modeNumberText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#64748B',
  },
  modeNumberTextActive: {
    color: '#FFFFFF',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  modeButtonText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#475569',
    flex: 1,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  modeButtonTextCaptured: {
    color: '#166534',
  },
  // Capture Button Styles
  captureButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  captureButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  captureButtonRecapture: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  captureButtonContent: {
    alignItems: 'center',
  },
  captureButtonIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  captureButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  // Error Styles
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  // Empty Capture Styles
  emptyCapture: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
  },
  emptyCaptureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyCaptureIconText: {
    fontSize: 22,
  },
  emptyCaptureText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#475569',
    marginBottom: 4,
  },
  emptyCaptureSubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#94A3B8',
  },
  // Results Styles
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultsHeader: {
    marginBottom: 10,
  },
  resultsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  resultsBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: '#166534',
  },
  resultsTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1E293B',
  },
  resultsSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#64748B',
    marginTop: 2,
  },
  fingersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: -4,
  },
  fingerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    width: (SCREEN_WIDTH - 72) / 2,
    alignItems: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fingerCardSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    margin: 3,
    minWidth: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fingerImage: {
    width: 60,
    height: 78,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 6,
  },
  fingerImageSmall: {
    width: 44,
    height: 56,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    marginBottom: 4,
  },
  fingerName: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4,
  },
  fingerNameSmall: {
    fontSize: 8,
    fontFamily: FONTS.medium,
    color: '#475569',
    textAlign: 'center',
  },
  qualityBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  qualityBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  // Action Buttons Styles
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    gap: 4,
  },
  resetButtonIcon: {
    fontSize: 14,
  },
  resetButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#22C55E',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  continueButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: SCREEN_HEIGHT * 0.8,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalIcon: {
    fontSize: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#64748B',
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  modalScrollContent: {
    padding: 12,
  },
  handSection: {
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  handHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  handEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  handLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#334155',
    flex: 1,
  },
  handCount: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  handFingersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  confirmSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  confirmText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#475569',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  modalButtonCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  modalButtonConfirm: {
    flex: 1.5,
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  // Incomplete Capture Modal Styles
  incompleteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  incompleteModalHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FEF3C7',
  },
  incompleteIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  incompleteIcon: {
    fontSize: 26,
  },
  incompleteModalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#92400E',
    marginBottom: 6,
  },
  incompleteModalSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#A16207',
    textAlign: 'center',
    lineHeight: 18,
  },
  missingCapturesContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  missingCapturesLabel: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#64748B',
    marginBottom: 10,
  },
  missingCapturesList: {
    gap: 8,
  },
  missingCaptureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  missingCaptureNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  missingCaptureNumberText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  missingCaptureText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#991B1B',
  },
  incompleteProgressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  incompleteProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incompleteProgressLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#64748B',
  },
  incompleteProgressCount: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#F59E0B',
  },
  incompleteProgressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  incompleteProgressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  incompleteModalButton: {
    backgroundColor: '#6366F1',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  incompleteModalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  // Low Quality Modal Styles
  lowQualityModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  lowQualityModalHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FEF2F2',
  },
  lowQualityIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#DC2626',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  lowQualityIcon: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  lowQualityModalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#991B1B',
    marginBottom: 6,
  },
  lowQualityModalSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#B91C1C',
    textAlign: 'center',
    lineHeight: 18,
  },
  lowQualityFingersContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  lowQualityFingersLabel: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#64748B',
    marginBottom: 10,
  },
  lowQualityFingersList: {
    gap: 8,
  },
  lowQualityFingerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  lowQualityFingerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  lowQualityFingerIconText: {
    fontSize: 16,
  },
  lowQualityFingerInfo: {
    flex: 1,
  },
  lowQualityFingerName: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#1E293B',
  },
  lowQualityFingerQuality: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: '#64748B',
    marginTop: 2,
  },
  lowQualityBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowQualityBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  lowQualityModalButtons: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  lowQualityButtonRecapture: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  lowQualityButtonRecaptureText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});

export default FingerCaptureScreen;
