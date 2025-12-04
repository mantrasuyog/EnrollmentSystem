import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import {selectUserEnrolled} from '../redux/userEnrollmentSlice';

import Tech5FaceCaptureScreen from './Tech5FaceCaptureScreen';
import FingerCaptureScreen from './FingerCaptureScreen';
import DocumentUploadScreen from './DocumentUploadScreen';
import SuccessScreen from './SuccessScreen';

import StepIndicator from '../components/StepIndicator';
import AnimatedScreen from '../components/AnimatedScreen';
import ValidationModal from '../components/ValidationModal';
import { colors } from '../common/colors';

// Sub-steps for step 2 (Biometric Info)
type BiometricSubStep = 'face' | 'finger';

const DashboardScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [biometricSubStep, setBiometricSubStep] = useState<BiometricSubStep>('face');
  const containerAnim = useRef(new Animated.Value(0)).current;

  const steps = useMemo(
    () => ['Documents Verification', 'Biometric Info', 'Details Verification'],
    [],
  );

  const faceEnrolled = useSelector(
    (state: RootState) => state.faceEnrollment.enrolledImageBase64,
  );
  const scanData = useSelector((state: RootState) => state.scan.scans);
  const userEnrolled = useSelector(selectUserEnrolled);

  const [showFaceRequiredModal, setShowFaceRequiredModal] = useState(false);
  const [showDocumentRequiredModal, setShowDocumentRequiredModal] =
    useState(false);

  useEffect(() => {
    Animated.timing(containerAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [containerAnim]);

  const faceRequiredModalData = useMemo(
    () => ({
      icon: '👤',
      iconBackgroundColor: colors.lightBlue1,
      title: 'Face Enrollment Required',
      subtitle:
        'Please complete face and fingerprint enrollment in Step 2 before proceeding to final verification.',
      steps: [
        {number: 1, text: 'Go back to Biometric Info'},
        {number: 2, text: 'Complete Face and Finger Enrollment'},
        {number: 3, text: 'Return to continue'},
      ],
      buttonGradient: [colors.purple1, colors.purple2],
      numberBackgroundColor: colors.purple1,
    }),
    [],
  );

  const documentRequiredModalData = useMemo(
    () => ({
      icon: '📄',
      iconBackgroundColor: colors.lightAmber1,
      title: 'Documents Required',
      subtitle:
        'Please upload and verify your documents in Step 1 before proceeding to biometric enrollment.',
      steps: [
        {number: 1, text: 'Go back to Documents Verification'},
        {number: 2, text: 'Upload required documents'},
        {number: 3, text: 'Return to continue'},
      ],
      buttonGradient: [colors.amber1, colors.amber2],
      numberBackgroundColor: colors.amber1,
    }),
    [],
  );

  const showFaceRequiredModalWithAnimation = useCallback(() => {
    setShowFaceRequiredModal(true);
  }, []);

  const closeFaceRequiredModal = useCallback(() => {
    setShowFaceRequiredModal(false);
  }, []);

  const showDocumentRequiredModalWithAnimation = useCallback(() => {
    setShowDocumentRequiredModal(true);
  }, []);

  const closeDocumentRequiredModal = useCallback(() => {
    setShowDocumentRequiredModal(false);
  }, []);

  const handleStepPress = useCallback(
    (step: number) => {
      // If user is already enrolled, prevent going back to steps 1 and 2
      if (userEnrolled && (step === 1 || step === 2)) {
        return;
      }

      if (step === 1) {
        setCurrentStep(1);
        return;
      }

      if (step === 2) {
        if (scanData.length === 0) {
          showDocumentRequiredModalWithAnimation();
          return;
        }
        setCurrentStep(2);
        return;
      }

      if (step === 3) {
        if (scanData.length === 0) {
          showDocumentRequiredModalWithAnimation();
          return;
        }
        if (!faceEnrolled) {
          showFaceRequiredModalWithAnimation();
          return;
        }
        setCurrentStep(3);
      }
    },
    [
      scanData.length,
      faceEnrolled,
      userEnrolled,
      showDocumentRequiredModalWithAnimation,
      showFaceRequiredModalWithAnimation,
    ],
  );

  const handleMoveToStep2 = useCallback(() => {
    if (scanData.length === 0) {
      showDocumentRequiredModalWithAnimation();
      return;
    }
    setCurrentStep(2);
  }, [scanData.length, showDocumentRequiredModalWithAnimation]);

  const handleMoveToStep3 = useCallback(() => {
    if (scanData.length === 0) {
      showDocumentRequiredModalWithAnimation();
      return;
    }
    if (!faceEnrolled) {
      showFaceRequiredModalWithAnimation();
      return;
    }
    // Reset biometric sub-step for next time
    setBiometricSubStep('face');
    setCurrentStep(3);
  }, [
    scanData.length,
    faceEnrolled,
    showDocumentRequiredModalWithAnimation,
    showFaceRequiredModalWithAnimation,
  ]);

  // Callback to move from face capture to finger capture within step 2
  const handleFaceCaptureComplete = useCallback(() => {
    setBiometricSubStep('finger');
  }, []);

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <DocumentUploadScreen onSubmitSuccess={handleMoveToStep2} />;
      case 2:
        // Handle sub-steps within biometric enrollment
        if (biometricSubStep === 'face') {
          return (
            <Tech5FaceCaptureScreen
              onFaceCaptureComplete={handleFaceCaptureComplete}
            />
          );
        } else {
          return (
            <FingerCaptureScreen
              onProceedToNext={handleMoveToStep3}
            />
          );
        }
      case 3:
        return <SuccessScreen />;
      default:
        return <DocumentUploadScreen onSubmitSuccess={handleMoveToStep2} />;
    }
  }, [currentStep, biometricSubStep, handleMoveToStep2, handleMoveToStep3, handleFaceCaptureComplete]);

  const backgroundColor = useMemo(
    () =>
      containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.lightGray1, colors.lightGray2],
      }),
    [containerAnim],
  );

  const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight || 0;

  return (
    <Animated.View style={[styles.container, {backgroundColor, paddingTop: STATUSBAR_HEIGHT}]}>
      <StatusBar backgroundColor={colors.lightGray2} barStyle="dark-content" />

      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepPress={handleStepPress}
      />

      <View style={styles.contentWrapper}>
        <AnimatedScreen key={`${currentStep}-${biometricSubStep}`}>
          {renderStepContent()}
        </AnimatedScreen>
      </View>

      {}
      <ValidationModal
        visible={showFaceRequiredModal}
        onClose={closeFaceRequiredModal}
        {...faceRequiredModalData}
      />

      {}
      <ValidationModal
        visible={showDocumentRequiredModal}
        onClose={closeDocumentRequiredModal}
        {...documentRequiredModalData}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray2,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    marginHorizontal: 0,
    marginTop: 4,
    marginBottom: 8,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default memo(DashboardScreen);
