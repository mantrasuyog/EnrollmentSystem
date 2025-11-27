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
  CaptureMode,
  FingerCaptureData,
  clearFingerEnrollment,
} from '../redux/fingerEnrollmentSlice';

interface FingerCaptureScreenProps {
  navigation?: any;
  route?: {
    params?: {
      config?: CaptureConfig;
      onCaptureComplete?: (result: CaptureResult) => void;
    };
  };
}

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Font family constants
const FONTS = {
  bold: 'Sen-Bold',
  semiBold: 'Sen-SemiBold',
  regular: 'Sen-Regular',
  medium: 'Sen-Medium',
};

const FingerCaptureScreen: React.FC<FingerCaptureScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useDispatch();
  const fingerEnrollment = useSelector(
    (state: RootState) => state.fingerEnrollment,
  );
  const allFingersEnrolled = useSelector(selectAllFingersEnrolled);
  const missingCaptures = useSelector(selectMissingCaptures);

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<CaptureMode>('left_slap');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const resetModalAnim = useRef(new Animated.Value(0)).current;

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
    if (!isCapturing && !isCaptured(selectedMode)) {
      pulse.start();
    }
    return () => pulse.stop();
  }, [isCapturing, selectedMode]);

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

      const captureData: FingerCaptureData = {
        fingers: result.fingers || [],
        capturedAt: new Date().toISOString(),
        livenessScores: result.livenessScores,
      };

      dispatch(setFingerCapture({mode: selectedMode, data: captureData}));
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
  }, [selectedMode, captureConfig, dispatch]);

  const handleContinue = useCallback(() => {
    if (!allFingersEnrolled) {
      const missingLabels = missingCaptures.map(mode => getModeLabel(mode));
      Alert.alert(
        'Incomplete Capture',
        `Please complete all fingerprint captures.\n\nMissing: ${missingLabels.join(', ')}`,
      );
      return;
    }
    setShowConfirmModal(true);
  }, [allFingersEnrolled, missingCaptures]);

  const handleConfirmProceed = useCallback(() => {
    setShowConfirmModal(false);
    if (onCaptureComplete && fingerEnrollment) {
      const allFingers: FingerData[] = [
        ...(fingerEnrollment.leftSlap?.fingers || []),
        ...(fingerEnrollment.leftThumb?.fingers || []),
        ...(fingerEnrollment.rightSlap?.fingers || []),
        ...(fingerEnrollment.rightThumb?.fingers || []),
      ];
      onCaptureComplete({fingers: allFingers, success: true});
    }
    if (navigation) {
      navigation.goBack();
    }
  }, [fingerEnrollment, onCaptureComplete, navigation]);

  const handleReset = useCallback(() => {
    setShowResetModal(true);
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
                activeOpacity={0.8}>
                <Text style={styles.modalButtonCancelText}>Re-capture</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleConfirmProceed}
                activeOpacity={0.8}>
                <Text style={styles.modalButtonConfirmText}>
                  Confirm & Proceed
                </Text>
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
        {/* Header */}
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
          <Text style={styles.subtitle}>Tech5 AirSnap Finger Scanner</Text>
        </Animated.View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Mode Selection */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  headerIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  headerIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: '#1E293B',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#64748B',
  },
  // Progress Styles
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#475569',
  },
  progressCount: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#6366F1',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 10,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  progressDotActive: {
    backgroundColor: '#22C55E',
  },
  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#334155',
    marginBottom: 12,
  },
  // Mode Selection Styles
  modeContainer: {
    marginBottom: 20,
  },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  modeButton: {
    width: (SCREEN_WIDTH - 52) / 2,
    margin: 6,
    padding: 14,
    borderRadius: 14,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeNumberActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  modeNumberText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#64748B',
  },
  modeNumberTextActive: {
    color: '#FFFFFF',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  modeButtonText: {
    fontSize: 14,
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
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
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
    fontSize: 28,
    marginBottom: 6,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  captureButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  // Error Styles
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  // Empty Capture Styles
  emptyCapture: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
  },
  emptyCaptureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyCaptureIconText: {
    fontSize: 28,
  },
  emptyCaptureText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#475569',
    marginBottom: 6,
  },
  emptyCaptureSubtext: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#94A3B8',
  },
  // Results Styles
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  resultsBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#166534',
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#1E293B',
  },
  resultsSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#64748B',
    marginTop: 2,
  },
  fingersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: -6,
  },
  fingerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    width: (SCREEN_WIDTH - 80) / 2,
    alignItems: 'center',
    margin: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fingerCardSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    margin: 4,
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fingerImage: {
    width: 70,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  fingerImageSmall: {
    width: 50,
    height: 65,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  fingerName: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 6,
  },
  fingerNameSmall: {
    fontSize: 9,
    fontFamily: FONTS.medium,
    color: '#475569',
    textAlign: 'center',
  },
  qualityBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  qualityBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  // Action Buttons Styles
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    gap: 6,
  },
  resetButtonIcon: {
    fontSize: 16,
  },
  resetButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  continueButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.85,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIcon: {
    fontSize: 26,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#1E293B',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#64748B',
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  modalScrollContent: {
    padding: 16,
  },
  handSection: {
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  handHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  handEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  handLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#334155',
    flex: 1,
  },
  handCount: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  handFingersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  confirmSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
  },
  confirmText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: '#475569',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  modalButtonCancelText: {
    color: '#64748B',
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  modalButtonConfirm: {
    flex: 1.5,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
});

export default FingerCaptureScreen;
