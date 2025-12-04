import React, {useState, useCallback, useEffect, useRef} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setEnrolledImage, clearEnrolledImage } from '../redux/faceEnrollmentSlice';
import { useNavigation } from '@react-navigation/native';
import { getFaceEnrollment } from '../services/database.service';
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
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Tech5Face, {
  CaptureResult,
  CaptureConfig,
  FaceData,
} from '../modules/Tech5Face';

interface Tech5FaceCaptureScreenProps {
  navigation?: any;
  route?: {
    params?: {
      config?: CaptureConfig;
      onCaptureComplete?: (result: CaptureResult) => void;
    };
  };
  onFaceCaptureComplete?: () => void;
}

type CaptureMode = 'standard' | 'icao' | 'liveness' | 'quick';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Font family constants
const FONTS = {
  bold: 'Sen-Bold',
  semiBold: 'Sen-SemiBold',
  regular: 'Sen-Regular',
  medium: 'Sen-Medium',
};

const Tech5FaceCaptureScreen: React.FC<Tech5FaceCaptureScreenProps> = ({
  navigation: propNavigation,
  route,
  onFaceCaptureComplete,
}) => {
  const dispatch = useDispatch();
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;
  // Select the latest scan from Redux
  const latestScan = useSelector((state: any) => {
    const scans = state.scan?.scans || [];
    return scans.length > 0 ? scans[scans.length - 1] : null;
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<CaptureMode>('standard');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExistingFaceModal, setShowExistingFaceModal] = useState(false);
  const [existingFaceImage, setExistingFaceImage] = useState<string | null>(null);

  // Get existing face enrollment from Redux
  const existingEnrolledFace = useSelector(
    (state: any) => state.faceEnrollment?.enrolledImageBase64,
  );

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(100)).current;

  const captureConfig = route?.params?.config || {};
  const onCaptureComplete = route?.params?.onCaptureComplete;

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
    if (!isCapturing && !captureResult) {
      pulse.start();
    }
    return () => pulse.stop();
  }, [isCapturing, captureResult]);

  // Modal animation
  useEffect(() => {
    if (showDetailModal) {
      Animated.parallel([
        Animated.timing(modalAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalAnim.setValue(0);
      modalSlideAnim.setValue(100);
    }
  }, [showDetailModal]);

  const handleCapture = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Error', 'Face capture is only available on Android');
      return;
    }

    setIsCapturing(true);
    setError(null);
    setCaptureResult(null);

    try {
      // Check camera permission first
      const hasPermission = await Tech5Face.checkCameraPermission();
      if (!hasPermission) {
        await Tech5Face.requestCameraPermission();
      }

      let result: CaptureResult;

      switch (selectedMode) {
        case 'icao':
          result = await Tech5Face.captureFaceWithICAO(captureConfig);
          break;
        case 'liveness':
          result = await Tech5Face.captureFaceWithLiveness(captureConfig);
          break;
        case 'quick':
          result = await Tech5Face.quickCapture(captureConfig);
          break;
        case 'standard':
        default:
          result = await Tech5Face.captureFace(captureConfig);
          break;
      }

      setCaptureResult(result);

      if (onCaptureComplete) {
        onCaptureComplete(result);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to capture face';
      setError(errorMessage);

      if (err.code !== 'CANCELLED') {
        Alert.alert('Capture Error', errorMessage);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [selectedMode, captureConfig, onCaptureComplete]);

  // Check for existing face enrollment and show modal if exists
  const checkExistingFaceAndCapture = useCallback(() => {
    // Check Redux first, then SQLite as fallback
    const existingFace = existingEnrolledFace || getFaceEnrollment();

    if (existingFace) {
      setExistingFaceImage(existingFace);
      setShowExistingFaceModal(true);
    } else {
      // No existing face, proceed with capture
      handleCapture();
    }
  }, [existingEnrolledFace, handleCapture]);

  const getModeLabel = (mode: CaptureMode): string => {
    switch (mode) {
      case 'standard':
        return 'Standard';
      case 'icao':
        return 'ICAO/ISO';
      case 'liveness':
        return 'Liveness';
      case 'quick':
        return 'Quick';
      default:
        return mode;
    }
  };

  const getModeDescription = (mode: CaptureMode): string => {
    switch (mode) {
      case 'standard':
        return 'Standard face capture with quality checks';
      case 'icao':
        return 'ISO/ICAO compliant capture for official documents';
      case 'liveness':
        return 'Includes passive liveness detection';
      case 'quick':
        return 'Fast capture with minimal checks';
      default:
        return '';
    }
  };

  const getModeIcon = (mode: CaptureMode): string => {
    switch (mode) {
      case 'standard':
        return '📷';
      case 'icao':
        return '🪪';
      case 'liveness':
        return '🔐';
      case 'quick':
        return '⚡';
      default:
        return '📷';
    }
  };

  const renderModeButton = (mode: CaptureMode) => {
    const isSelected = selectedMode === mode;

    return (
      <Animated.View
        key={mode}
        style={{
          opacity: fadeAnim,
          transform: [
            {translateY: slideAnim},
            {scale: isSelected ? 1.02 : 1},
          ],
        }}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            isSelected && styles.modeButtonActive,
          ]}
          onPress={() => setSelectedMode(mode)}
          activeOpacity={0.8}>
          <View style={styles.modeButtonContent}>
            <View style={styles.modeIconContainer}>
              <View
                style={[
                  styles.modeNumber,
                  isSelected && styles.modeNumberActive,
                ]}>
                <Text style={styles.modeIconText}>{getModeIcon(mode)}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.modeButtonText,
                isSelected && styles.modeButtonTextActive,
              ]}>
              {getModeLabel(mode)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderModeSelector = () => (
    <View style={styles.modeContainer}>
      <Text style={styles.sectionTitle}>Select Capture Mode</Text>
      <View style={styles.modeButtons}>
        {(['standard', 'icao', 'liveness', 'quick'] as CaptureMode[]).map(
          (mode) => renderModeButton(mode),
        )}
      </View>
      <View style={styles.modeDescriptionContainer}>
        <Text style={styles.modeDescriptionIcon}>{getModeIcon(selectedMode)}</Text>
        <Text style={styles.modeDescription}>{getModeDescription(selectedMode)}</Text>
      </View>
    </View>
  );

  const renderQualityScore = (label: string, value: number, threshold?: number) => {
    const isGood = threshold ? value <= threshold : value >= 0.5;
    return (
      <View style={styles.qualityRow}>
        <Text style={styles.qualityLabel}>{label}</Text>
        <View style={[styles.qualityValueContainer, isGood ? styles.qualityGoodBg : styles.qualityBadBg]}>
          <Text style={[styles.qualityValue, isGood ? styles.qualityGood : styles.qualityBad]}>
            {value.toFixed(3)}
          </Text>
        </View>
      </View>
    );
  };

  const renderDetailModal = () => {
    if (!captureResult?.faceData) return null;

    const faceData = captureResult.faceData;
    const compliance = Tech5Face.isICAOCompliant(faceData);

    const modalScale = modalAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    });

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalAnim,
                transform: [
                  {scale: modalScale},
                  {translateY: modalSlideAnim},
                ],
              },
            ]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTop}>
                <View style={styles.modalIconCircle}>
                  <Text style={styles.modalIcon}>📊</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDetailModal(false)}
                  activeOpacity={0.7}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalTitle}>Face Analysis Report</Text>
              <Text style={styles.modalSubtitle}>
                Detailed quality metrics and compliance status
              </Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}>

              {/* Compliance Status */}
              <View style={[styles.complianceBox, compliance.compliant ? styles.complianceGood : styles.complianceBad]}>
                <View style={styles.complianceHeader}>
                  <Text style={styles.complianceIcon}>{compliance.compliant ? '✓' : '⚠️'}</Text>
                  <Text style={[styles.complianceText, compliance.compliant ? styles.complianceTextGood : styles.complianceTextBad]}>
                    {compliance.compliant ? 'ICAO Compliant' : 'Non-Compliant'}
                  </Text>
                </View>
                {!compliance.compliant && compliance.issues.length > 0 && (
                  <View style={styles.issuesList}>
                    {compliance.issues.map((issue, index) => (
                      <Text key={index} style={styles.issueText}>• {issue}</Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Pose Angles */}
              <View style={styles.qualitySection}>
                <View style={styles.qualitySectionHeader}>
                  <Text style={styles.qualitySectionIcon}>🎯</Text>
                  <Text style={styles.qualitySectionTitle}>Pose Angles</Text>
                </View>
                {renderQualityScore('Pan (Yaw)', Math.abs(faceData.pan), 15)}
                {renderQualityScore('Pitch', Math.abs(faceData.pitch), 15)}
                {renderQualityScore('Roll', Math.abs(faceData.roll), 10)}
              </View>

              {/* Occlusion Detection */}
              <View style={styles.qualitySection}>
                <View style={styles.qualitySectionHeader}>
                  <Text style={styles.qualitySectionIcon}>👁️</Text>
                  <Text style={styles.qualitySectionTitle}>Occlusion Detection</Text>
                </View>
                {renderQualityScore('Mask', faceData.maskScore, 0.5)}
                {renderQualityScore('Sunglasses', faceData.sunGlassScore, 0.5)}
                {renderQualityScore('Any Glasses', faceData.anyGlassScore, 0.5)}
                {renderQualityScore('Hat', faceData.hatScore, 0.4)}
                {renderQualityScore('Headphones', faceData.headphonesScore, 0.4)}
              </View>

              {/* Eye Status */}
              <View style={styles.qualitySection}>
                <View style={styles.qualitySectionHeader}>
                  <Text style={styles.qualitySectionIcon}>👀</Text>
                  <Text style={styles.qualitySectionTitle}>Eye Status</Text>
                </View>
                {renderQualityScore('Left Eye Closed', faceData.leftEyeCloseScore, 0.8)}
                {renderQualityScore('Right Eye Closed', faceData.rightEyeCloseScore, 0.8)}
                {renderQualityScore('Eye Distance', faceData.eyeDistance)}
              </View>

              {/* Image Quality */}
              <View style={styles.qualitySection}>
                <View style={styles.qualitySectionHeader}>
                  <Text style={styles.qualitySectionIcon}>📊</Text>
                  <Text style={styles.qualitySectionTitle}>Image Quality</Text>
                </View>
                {renderQualityScore('Blur', faceData.blurScore, 0.5)}
                {renderQualityScore('Exposure', faceData.exposureScore)}
                {renderQualityScore('Brightness', faceData.brightnessScore)}
                {renderQualityScore('Uniform Background', faceData.uniformBackgroundScore)}
              </View>

              {/* Portal Image */}
              {faceData.hasPortalImage && faceData.portalImageBase64 && (
                <View style={styles.portalImageSection}>
                  <View style={styles.qualitySectionHeader}>
                    <Text style={styles.qualitySectionIcon}>✂️</Text>
                    <Text style={styles.qualitySectionTitle}>Cropped Portrait</Text>
                  </View>
                  <View style={styles.portalImageWrapper}>
                    <Image
                      source={{uri: Tech5Face.toImageUri(faceData.portalImageBase64)}}
                      style={styles.portalImage}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowDetailModal(false)}
                activeOpacity={0.85}>
                <Text style={styles.modalCloseBtnText}>Close Report</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // Modal for existing face enrollment
  const renderExistingFaceModal = () => {
    if (!existingFaceImage) return null;

    const imageUri = Tech5Face.toImageUri(existingFaceImage);

    return (
      <Modal
        visible={showExistingFaceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExistingFaceModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.existingFaceModalContainer}>
            {/* Modal Header */}
            <View style={styles.existingFaceModalHeader}>
              <View style={styles.existingFaceIconCircle}>
                <Text style={styles.existingFaceIcon}>😊</Text>
              </View>
              <Text style={styles.existingFaceTitle}>Face Already Enrolled</Text>
              <Text style={styles.existingFaceSubtitle}>
                A face has already been captured for this enrollment. What would you like to do?
              </Text>
            </View>

            {/* Existing Face Image */}
            <View style={styles.existingFaceImageContainer}>
              <Image source={{uri: imageUri}} style={styles.existingFaceImage} />
            </View>

            {/* Action Buttons */}
            <View style={styles.existingFaceActions}>
              {/* Enroll New Face Button */}
              <TouchableOpacity
                style={styles.enrollNewFaceButton}
                onPress={() => {
                  setShowExistingFaceModal(false);
                  // Clear existing face and start new capture
                  dispatch(clearEnrolledImage());
                  handleCapture();
                }}
                activeOpacity={0.85}>
                <Text style={styles.enrollNewFaceIcon}>📷</Text>
                <Text style={styles.enrollNewFaceText}>Enroll New Face</Text>
              </TouchableOpacity>

              {/* Keep Existing Button */}
              <TouchableOpacity
                style={styles.keepExistingButton}
                onPress={() => {
                  setShowExistingFaceModal(false);
                  // Set the existing face as capture result to show it
                  setCaptureResult({
                    success: true,
                    imageBase64: existingFaceImage,
                    faceData: undefined,
                    timedOut: false,
                  });
                }}
                activeOpacity={0.85}>
                <Text style={styles.keepExistingIcon}>✓</Text>
                <Text style={styles.keepExistingText}>Keep Existing Face</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowExistingFaceModal(false)}
              activeOpacity={0.85}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderCaptureResult = () => {
    if (!captureResult || !captureResult.success) return null;

    const imageUri = captureResult.imageBase64
      ? Tech5Face.toImageUri(captureResult.imageBase64)
      : null;

    const compliance = captureResult.faceData
      ? Tech5Face.isICAOCompliant(captureResult.faceData)
      : null;

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
          <Text style={styles.resultsTitle}>Capture Result</Text>
          <Text style={styles.resultsSubtitle}>
            {getModeLabel(selectedMode)} capture completed
          </Text>
        </View>

        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{uri: imageUri}} style={styles.faceImage} />
            {/* Show Name below image if available */}
            {latestScan?.Name && (
              <Text style={{
                textAlign: 'center',
                fontSize: 18,
                fontFamily: FONTS.semiBold,
                marginTop: 10,
                color: '#334155',
              }}>{latestScan.Name}</Text>
            )}
            {/* Only show ICAO Compliant badge if compliant, remove Non-Compliant */}
            {compliance && compliance.compliant && (
              <View style={[styles.complianceBadgeOverlay, styles.complianceBadgeGood]}>
                <Text style={styles.complianceBadgeIcon}>✓</Text>
                <Text style={[styles.complianceBadgeText, styles.complianceBadgeTextGood]}>
                  ICAO Compliant
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderEmptyState = () => {
    if (captureResult) return null;

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
          <Text style={styles.emptyCaptureIconText}>🤳</Text>
        </View>
        <Text style={styles.emptyCaptureText}>Ready for Face Capture</Text>
        <Text style={styles.emptyCaptureSubtext}>
          Tap the button below to start scanning
        </Text>
      </Animated.View>
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
            <Text style={styles.headerIcon}>😊</Text>
          </View>
          <Text style={styles.title}>Face Capture</Text>
          <Text style={styles.subtitle}>Mantra Face Scanner</Text>
        </Animated.View>

       

        {renderEmptyState()}

        <Animated.View
          style={{
            transform: [{scale: isCapturing ? 1 : pulseAnim}],
          }}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isCapturing && styles.captureButtonDisabled,
              captureResult && styles.captureButtonRecapture,
            ]}
            onPress={checkExistingFaceAndCapture}
            disabled={isCapturing}
            activeOpacity={0.85}>
            {isCapturing ? (
              <View style={styles.captureButtonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.captureButtonText}>Capturing...</Text>
              </View>
            ) : (
              <View style={styles.captureButtonContent}>
                <Text style={styles.captureButtonIcon}>
                  {captureResult ? '🔄' : '📷'}
                </Text>
                <Text style={styles.captureButtonText}>
                  {captureResult ? 'Re-capture Face' : 'Start Face Capture'}
                </Text>
                <Text style={styles.captureButtonSubtext}>
                  {getModeLabel(selectedMode)} Mode
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
              {opacity: fadeAnim},
            ]}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Timeout Warning */}
        {captureResult?.timedOut && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningIcon}>⏱️</Text>
            <Text style={styles.warningText}>
              Capture timed out. Best available frame returned.
            </Text>
          </View>
        )}

        {/* Capture Results */}
        {renderCaptureResult()}

        {/* View Detail Report Button */}
        {/* {captureResult?.faceData && (
          <TouchableOpacity
            style={styles.viewDetailButton}
            onPress={() => setShowDetailModal(true)}
            activeOpacity={0.85}>
            <Text style={styles.viewDetailIcon}>📋</Text>
            <Text style={styles.viewDetailText}>View Detailed Report</Text>
            <Text style={styles.viewDetailArrow}>→</Text>
          </TouchableOpacity>
        )} */}

        {/* Continue Button */}
        {captureResult && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              dispatch(clearEnrolledImage());
              if (captureResult.imageBase64) {
                dispatch(setEnrolledImage(captureResult.imageBase64));
              }
              // Call the callback to move to finger capture step
              if (onFaceCaptureComplete) {
                onFaceCaptureComplete();
              } else if (navigation) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.85}>
            <Text style={styles.continueButtonText}>Continue</Text>
            <Text style={styles.continueButtonIcon}>→</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Existing Face Modal */}
      {renderExistingFaceModal()}
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
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIconContainer: {
    marginRight: 10,
  },
  modeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeNumberActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  modeIconText: {
    fontSize: 16,
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
  modeDescriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  modeDescriptionIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  modeDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#64748B',
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
    fontSize: 18,
    marginRight: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  // Warning Styles
  warningContainer: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    color: '#D97706',
    fontSize: 12,
    fontFamily: FONTS.medium,
    flex: 1,
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
  imageContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  faceImage: {
    width: 160,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  complianceBadgeOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  complianceBadgeGood: {
    backgroundColor: '#DCFCE7',
  },
  complianceBadgeBad: {
    backgroundColor: '#FEE2E2',
  },
  complianceBadgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  complianceBadgeText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  complianceBadgeTextGood: {
    color: '#166534',
  },
  complianceBadgeTextBad: {
    color: '#DC2626',
  },
  // View Detail Button
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewDetailIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  viewDetailText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#6366F1',
    flex: 1,
  },
  viewDetailArrow: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#6366F1',
  },
  // Continue Button Styles
  continueButton: {
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 24,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: FONTS.bold,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#64748B',
  },
  modalScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  modalScrollContent: {
    padding: 16,
    gap: 12,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCloseBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  // Compliance Box Styles
  complianceBox: {
    padding: 16,
    borderRadius: 12,
  },
  complianceGood: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  complianceBad: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  complianceText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  complianceTextGood: {
    color: '#166534',
  },
  complianceTextBad: {
    color: '#DC2626',
  },
  issuesList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  issueText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#DC2626',
    marginTop: 4,
  },
  // Quality Section Styles
  qualitySection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qualitySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  qualitySectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  qualitySectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#334155',
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  qualityLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#64748B',
  },
  qualityValueContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qualityGoodBg: {
    backgroundColor: '#DCFCE7',
  },
  qualityBadBg: {
    backgroundColor: '#FEE2E2',
  },
  qualityValue: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  qualityGood: {
    color: '#166534',
  },
  qualityBad: {
    color: '#DC2626',
  },
  // Portal Image Styles
  portalImageSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  portalImageWrapper: {
    alignItems: 'center',
    paddingTop: 8,
  },
  portalImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  // Existing Face Modal Styles
  existingFaceModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxWidth: 360,
    overflow: 'hidden',
    padding: 20,
  },
  existingFaceModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  existingFaceIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  existingFaceIcon: {
    fontSize: 28,
  },
  existingFaceTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  existingFaceSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  existingFaceImageContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  existingFaceImage: {
    width: 140,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  existingFaceActions: {
    gap: 12,
    marginBottom: 12,
  },
  enrollNewFaceButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  enrollNewFaceIcon: {
    fontSize: 18,
  },
  enrollNewFaceText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  keepExistingButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#22C55E',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  keepExistingIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  keepExistingText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  cancelModalButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#64748B',
  },
});

export default Tech5FaceCaptureScreen;
