import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { colors } from '../common/colors';
import {
  FingerTemplates,
  FingerKey,
  fingerKeyToTitle,
} from '../redux/fingerEnrollmentSlice';
import { resetUserEnrollment } from '../redux/userEnrollmentSlice';
import { clearScanData } from '../redux/scanSlice';
import { clearEnrolledImage } from '../redux/faceEnrollmentSlice';
import { clearFingerEnrollment } from '../redux/fingerEnrollmentSlice';
import apiService from '../services/api.service';
import { clearAllEnrollmentData } from '../services/database.service';
import { generateAndSharePDF } from '../services/pdfReport.service';

const { width: screenWidth } = Dimensions.get('window');

const fonts = {
  bold: 'Sen-Bold',
  semiBold: 'Sen-SemiBold',
  regular: 'Sen-Regular',
};

interface EnrollmentStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onEnrollNew: () => void;
  onEnrollmentSuccess: () => void;
  isUserEnrolled: boolean;
  fingerTemplatesForApi: Record<string, string>;
  enrollmentData: {
    scanData?: {
      Registration_Number: string;
      Name: string;
      Portrait_Image: string;
      Document_Image: string;
      scanned_json: string;
      Centre_Code: string;
    };
    faceImage?: string;
    fingerTemplates?: FingerTemplates;
  };
}

const EnrollmentStatusModal: React.FC<EnrollmentStatusModalProps> = ({
  visible,
  onClose,
  onEnrollNew,
  onEnrollmentSuccess,
  isUserEnrolled,
  fingerTemplatesForApi,
  enrollmentData,
}) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const documentPreviewOpacity = useRef(new Animated.Value(0)).current;

  const [showDocumentPreview, setShowDocumentPreview] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<{
    type: string;
    title: string;
    image?: string;
    hand?: 'left' | 'right';
  } | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      modalOpacity.setValue(0);
      scaleAnim.setValue(0.8);
      pulseAnim.setValue(1);
    }
  }, [visible, modalOpacity, scaleAnim, pulseAnim]);

  const parseScanData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  };

  const scannedData = useMemo(() => {
    if (!enrollmentData.scanData) return [];
    return parseScanData(enrollmentData.scanData.scanned_json);
  }, [enrollmentData.scanData]);

  const leftHandFingers: FingerKey[] = [
    'left_thumb',
    'left_index',
    'left_middle',
    'left_ring',
    'left_little',
  ];
  const rightHandFingers: FingerKey[] = [
    'right_thumb',
    'right_index',
    'right_middle',
    'right_ring',
    'right_little',
  ];

  const hasLeftHandFingerprints = useMemo(() => {
    if (!enrollmentData.fingerTemplates) return false;
    return leftHandFingers.some(
      key => enrollmentData.fingerTemplates?.[key] !== null,
    );
  }, [enrollmentData.fingerTemplates]);

  const hasRightHandFingerprints = useMemo(() => {
    if (!enrollmentData.fingerTemplates) return false;
    return rightHandFingers.some(
      key => enrollmentData.fingerTemplates?.[key] !== null,
    );
  }, [enrollmentData.fingerTemplates]);

  const hasAnyFingerprints =
    hasLeftHandFingerprints || hasRightHandFingerprints;

  const canSubmitEnrollment = useMemo(() => {
    return (
      !isUserEnrolled &&
      enrollmentData.scanData &&
      enrollmentData.faceImage &&
      hasAnyFingerprints
    );
  }, [
    isUserEnrolled,
    enrollmentData.scanData,
    enrollmentData.faceImage,
    hasAnyFingerprints,
  ]);

  const handleSubmitEnrollment = useCallback(async () => {
    if (!enrollmentData.scanData || !enrollmentData.faceImage) {
      setSubmitError('Missing required enrollment data.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      let parsedScannedJson;
      try {
        parsedScannedJson =
          typeof enrollmentData.scanData.scanned_json === 'string'
            ? JSON.parse(enrollmentData.scanData.scanned_json)
            : enrollmentData.scanData.scanned_json;
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

      let cleanedName = enrollmentData.scanData.Name || '';
      if (cleanedName.startsWith('Name\n')) {
        cleanedName = cleanedName.replace('Name\n', '').trim();
      } else if (cleanedName.startsWith('Name')) {
        cleanedName = cleanedName.replace('Name', '').trim();
      }

      const apiRequestBody = {
        center_code: enrollmentData.scanData.Centre_Code,
        document_image: enrollmentData.scanData.Document_Image,
        name: cleanedName,
        portrait_image: enrollmentData.scanData.Portrait_Image,
        registration_id: enrollmentData.scanData.Registration_Number,
        scanned_json: scannedJsonObject,
      };

      await apiService.post('/users/', apiRequestBody);

      const templateEnrollmentBody = {
        biometric_data: {
          biometrics: {
            face: enrollmentData.faceImage,
            fingerprints: fingerTemplatesForApi,
          },
        },
        registration_id: enrollmentData.scanData.Registration_Number,
      };

      if (__DEV__) {
        console.log(
          'biometric_data request body:',
          JSON.stringify(templateEnrollmentBody, null, 2),
        );
      }

      await apiService.post('/biometric/enroll', templateEnrollmentBody);

      // Clear all Redux slices after successful enrollment (Status: 200)
      dispatch(clearScanData());
      dispatch(clearEnrolledImage());
      dispatch(clearFingerEnrollment());
      dispatch(resetUserEnrollment());

      // Clear SQLite data
      clearAllEnrollmentData();

      setSubmitError(null);

      // Navigate to new enrollment
      onEnrollNew();
    } catch (error: any) {
      let errorMessage =
        'Network error. Please check your connection and try again.';

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

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [enrollmentData, fingerTemplatesForApi, dispatch, onEnrollmentSuccess]);

  const getFingerCountForHand = useCallback(
    (hand: 'left' | 'right') => {
      if (!enrollmentData.fingerTemplates) return 0;
      const fingers = hand === 'left' ? leftHandFingers : rightHandFingers;
      return fingers.filter(
        key => enrollmentData.fingerTemplates?.[key] !== null,
      ).length;
    },
    [enrollmentData.fingerTemplates],
  );

  const handleDownloadReport = useCallback(() => {
    if (isGeneratingPDF) return;

    setIsGeneratingPDF(true);

    setTimeout(async () => {
      try {
        let parsedScannedData: Array<{ name: string; value: string }> = [];
        if (enrollmentData.scanData?.scanned_json) {
          try {
            const parsed = JSON.parse(enrollmentData.scanData.scanned_json);
            if (Array.isArray(parsed)) {
              parsedScannedData = parsed;
            }
          } catch {
            console.warn('Failed to parse scanned_json for PDF report');
          }
        }

        let cleanedName = enrollmentData.scanData?.Name || '';
        if (cleanedName.startsWith('Name\n')) {
          cleanedName = cleanedName.replace('Name\n', '').trim();
        } else if (cleanedName.startsWith('Name')) {
          cleanedName = cleanedName.replace('Name', '').trim();
        }

        const reportData = {
          registrationNumber:
            enrollmentData.scanData?.Registration_Number || '',
          name: cleanedName,
          centreCode: enrollmentData.scanData?.Centre_Code || '',
          scannedData: parsedScannedData,
          portraitImage: enrollmentData.scanData?.Portrait_Image,
          documentImage: enrollmentData.scanData?.Document_Image,
          faceImage: enrollmentData.faceImage,
          fingerTemplates: enrollmentData.fingerTemplates,
          enrollmentDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        };

        const result = await generateAndSharePDF(reportData);

        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to generate PDF report');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to generate PDF report');
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 100);
  }, [enrollmentData, isGeneratingPDF]);

  const handleOpenDocumentPreview = useCallback(
    (documentType: string, title: string, hand?: 'left' | 'right') => {
      setSelectedDocument({ type: documentType, title, hand });
      setShowDocumentPreview(true);
      Animated.timing(documentPreviewOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    [documentPreviewOpacity],
  );

  const handleCloseDocumentPreview = useCallback(() => {
    Animated.timing(documentPreviewOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDocumentPreview(false);
      setSelectedDocument(null);
    });
  }, [documentPreviewOpacity]);

  const getDocumentImage = useCallback(() => {
    if (!selectedDocument) return null;

    switch (selectedDocument.type) {
      case 'id':
        const docImage = enrollmentData.scanData?.Document_Image;
        if (docImage) {
          if (docImage.startsWith('data:image')) {
            return docImage;
          }
          return `data:image/jpeg;base64,${docImage}`;
        }
        return null;
      case 'photo':
        const portraitImage = enrollmentData.scanData?.Portrait_Image;
        if (portraitImage) {
          if (portraitImage.startsWith('data:image')) {
            return portraitImage;
          }
          return `data:image/jpeg;base64,${portraitImage}`;
        }
        return null;
      case 'face':
        const faceImg = enrollmentData.faceImage;
        if (faceImg) {
          if (faceImg.startsWith('data:image')) {
            return faceImg;
          }
          return `data:image/jpeg;base64,${faceImg}`;
        }
        return null;
      case 'fingerprint':
        const fingerprintImage = (enrollmentData.scanData as any)
          ?.Fingerprint_Image;
        if (fingerprintImage) {
          if (fingerprintImage.startsWith('data:image')) {
            return fingerprintImage;
          }
          return `data:image/jpeg;base64,${fingerprintImage}`;
        }
        return null;
      default:
        return null;
    }
  }, [selectedDocument, enrollmentData]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
      <TouchableOpacity
        style={styles.modalBackground}
        onPress={onClose}
        activeOpacity={1}
      />

      <Animated.View
        style={[
          styles.modalContent,
          {
            opacity: modalOpacity,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.modalScrollView}
          showsVerticalScrollIndicator={true}
        >
          <LinearGradient
            colors={
              isUserEnrolled
                ? ['#6366F1', '#8B5CF6', '#A855F7']
                : ['#F59E0B', '#F97316', '#EA580C']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <View style={styles.headerPattern} />
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LinearGradient
                colors={isUserEnrolled ? ['#22C55E', '#16A34A'] : ['#FBBF24', '#F59E0B']}
                style={[styles.checkmarkCircle, !isUserEnrolled && styles.pendingCircle]}
              >
                <Text style={styles.checkmarkIcon}>
                  {isUserEnrolled ? '✓' : '⏳'}
                </Text>
              </LinearGradient>
            </Animated.View>
            <Text style={styles.modalTitle}>
              {isUserEnrolled ? 'Enrollment Complete!' : 'Submission Pending'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isUserEnrolled
                ? 'Your biometric data has been successfully registered'
                : 'Your enrollment data is ready for submission'}
            </Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {isUserEnrolled ? 'VERIFIED' : 'PENDING'}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageWrapper}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#A855F7']}
                style={styles.profileImageRing}
              >
                <View style={styles.profileImageInner}>
                  {enrollmentData.faceImage ? (
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${enrollmentData.faceImage}`,
                      }}
                      style={styles.profileImageActual}
                    />
                  ) : enrollmentData.scanData?.Portrait_Image ? (
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${enrollmentData.scanData.Portrait_Image}`,
                      }}
                      style={styles.profileImageActual}
                    />
                  ) : (
                    <View style={styles.profileImage}>
                      <Text style={styles.profileImagePlaceholder}>👤</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
              <View style={styles.profileVerifiedBadge}>
                <Text style={styles.profileVerifiedIcon}>✓</Text>
              </View>
            </View>
          </View>

          <View style={styles.registrationCard}>
            <View style={styles.registrationItem}>
              <Text style={styles.registrationLabel}>Registration Number</Text>
              <Text style={styles.registrationValue}>
                {enrollmentData.scanData?.Registration_Number || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Basic Information</Text>

            {enrollmentData.scanData?.Name && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Full Name:</Text>
                <Text style={styles.detailValueText}>
                  {enrollmentData.scanData.Name}
                </Text>
              </View>
            )}

            {scannedData && scannedData.length > 0
              ? scannedData.map((item: any, index: number) => (
                  <View key={index} style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{item.name}:</Text>
                    <Text style={styles.detailValueText}>{item.value}</Text>
                  </View>
                ))
              : null}

            {(!scannedData || scannedData.length === 0) &&
              !enrollmentData.scanData?.Name && (
                <Text style={styles.noDataText}>
                  No enrollment data available
                </Text>
              )}
          </View>

          <View style={styles.documentsSection}>
            <Text style={styles.detailsSectionTitle}>Enrolled Documents</Text>

            {enrollmentData.scanData?.Document_Image && (
              <View style={styles.documentCard}>
                <LinearGradient
                  colors={['#EEF2FF', '#E0E7FF']}
                  style={styles.documentIconContainer}
                >
                  <Text style={styles.documentIcon}>🆔</Text>
                </LinearGradient>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>ID Document</Text>
                  <Text style={styles.documentStatus}>✓ Verified</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleOpenDocumentPreview('id', 'ID Document')}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.viewButtonGradient}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {enrollmentData.scanData?.Portrait_Image && (
              <View style={styles.documentCard}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.documentIconContainer}
                >
                  <Text style={styles.documentIcon}>📷</Text>
                </LinearGradient>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Portrait Photo</Text>
                  <Text style={styles.documentStatus}>✓ Verified</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() =>
                    handleOpenDocumentPreview('photo', 'Portrait Photo')
                  }
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.viewButtonGradient}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {enrollmentData.faceImage && (
              <View style={styles.documentCard}>
                <LinearGradient
                  colors={['#FEF3C7', '#FDE68A']}
                  style={styles.documentIconContainer}
                >
                  <Text style={styles.documentIcon}>😊</Text>
                </LinearGradient>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Face Enrollment</Text>
                  <Text style={styles.documentStatus}>✓ Verified</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() =>
                    handleOpenDocumentPreview('face', 'Face Enrollment')
                  }
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.viewButtonGradient}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {(enrollmentData.scanData as any)?.Fingerprint_Image && (
              <View style={styles.documentCard}>
                <LinearGradient
                  colors={['#FCE7F3', '#FBCFE8']}
                  style={styles.documentIconContainer}
                >
                  <Text style={styles.documentIcon}>👆</Text>
                </LinearGradient>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Fingerprint</Text>
                  <Text style={styles.documentStatus}>✓ Verified</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() =>
                    handleOpenDocumentPreview('fingerprint', 'Fingerprint')
                  }
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.viewButtonGradient}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {hasLeftHandFingerprints && (
              <View style={styles.documentCard}>
                <LinearGradient
                  colors={['#F3E8FF', '#E9D5FF']}
                  style={styles.documentIconContainer}
                >
                  <Text style={styles.documentIcon}>🤚</Text>
                </LinearGradient>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>
                    Left Hand Fingerprints
                  </Text>
                  <Text style={styles.documentStatus}>
                    ✓ {getFingerCountForHand('left')} finger(s) enrolled
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() =>
                    handleOpenDocumentPreview(
                      'fingerprint_hand',
                      'Left Hand Fingerprints',
                      'left',
                    )
                  }
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.viewButtonGradient}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {hasRightHandFingerprints && (
              <View style={styles.documentCard}>
                <LinearGradient
                  colors={['#DBEAFE', '#BFDBFE']}
                  style={styles.documentIconContainer}
                >
                  <Text style={styles.documentIcon}>✋</Text>
                </LinearGradient>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>
                    Right Hand Fingerprints
                  </Text>
                  <Text style={styles.documentStatus}>
                    ✓ {getFingerCountForHand('right')} finger(s) enrolled
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() =>
                    handleOpenDocumentPreview(
                      'fingerprint_hand',
                      'Right Hand Fingerprints',
                      'right',
                    )
                  }
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.viewButtonGradient}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.actionButtonsContainer}>
            {submitError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            )}

            {canSubmitEnrollment && (
              <TouchableOpacity
                style={[
                  styles.submitEnrollmentButton,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleSubmitEnrollment}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={[colors.purple1, colors.purple2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitEnrollmentButtonGradient}
                >
                  {isSubmitting ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color={colors.white} size="small" />
                      <Text style={styles.submitEnrollmentButtonText}>
                        Submitting...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.submitEnrollmentButtonText}>
                      Submit Enrollment
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Show Download Report button if user is enrolled */}
            {isUserEnrolled && (
              <TouchableOpacity
                style={[
                  styles.downloadReportButton,
                  isGeneratingPDF && styles.buttonDisabled,
                ]}
                onPress={handleDownloadReport}
                disabled={isGeneratingPDF}
              >
                <LinearGradient
                  colors={[colors.deepBlue1, colors.deepBlue2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.downloadReportButtonGradient}
                >
                  {isGeneratingPDF ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color={colors.white} size="small" />
                      <Text style={styles.downloadReportButtonText}>
                        Generating PDF...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.downloadReportContent}>
                      <Text style={styles.downloadReportIcon}>📄</Text>
                      <Text style={styles.downloadReportButtonText}>
                        Download Enrollment Report
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.enrollNewButton}
                onPress={onEnrollNew}
              >
                <LinearGradient
                  colors={[colors.green1, colors.green2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.enrollNewButtonGradient}
                >
                  <Text style={styles.enrollNewButtonText}>Enroll New</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                <View style={styles.closeButtonPlain}>
                  <Text style={styles.closeButtonPlainText}>Close</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {showDocumentPreview && selectedDocument && (
        <Animated.View
          style={[
            styles.documentPreviewOverlay,
            { opacity: documentPreviewOpacity },
          ]}
        >
          <TouchableOpacity
            style={styles.documentPreviewBackground}
            onPress={handleCloseDocumentPreview}
            activeOpacity={1}
          />

          <Animated.View
            style={[
              styles.documentPreviewContent,
              { opacity: documentPreviewOpacity },
            ]}
          >
            <TouchableOpacity
              style={styles.documentPreviewCloseButton}
              onPress={handleCloseDocumentPreview}
            >
              <Text style={styles.documentPreviewCloseIcon}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              style={styles.documentPreviewScrollView}
              contentContainerStyle={styles.documentPreviewScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.documentPreviewHeader}>
                <Text style={styles.documentPreviewTitle}>
                  {selectedDocument.type === 'fingerprint_hand'
                    ? 'Fingerprint Preview'
                    : 'Document Preview'}
                </Text>
                <Text style={styles.documentPreviewSubtitle}>
                  {selectedDocument.title}
                </Text>
              </View>

              {selectedDocument.type === 'fingerprint_hand' &&
              selectedDocument.hand ? (
                <View style={styles.fingerprintGridContainer}>
                  {(selectedDocument.hand === 'left'
                    ? leftHandFingers
                    : rightHandFingers
                  ).map(fingerKey => {
                    const template =
                      enrollmentData.fingerTemplates?.[fingerKey];
                    if (!template) return null;
                    return (
                      <View key={fingerKey} style={styles.fingerprintItem}>
                        <Image
                          source={{
                            uri: `data:image/jpeg;base64,${template.base64Image}`,
                          }}
                          style={styles.fingerprintImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.fingerprintLabel}>
                          {fingerKeyToTitle[fingerKey]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : getDocumentImage() ? (
                <Image
                  source={{ uri: getDocumentImage()! }}
                  style={styles.documentPreviewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImageContainer}>
                  <Text style={styles.noImageText}>No image available</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.documentPreviewCloseButton2}
                onPress={handleCloseDocumentPreview}
              >
                <Text style={styles.documentPreviewCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: screenWidth * 0.92,
    maxHeight: '85%',
    paddingBottom: 12,
    zIndex: 10000,
    elevation: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  closeIcon: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  modalScrollView: {
    paddingTop: 0,
  },
  gradientHeader: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: 'center',
    marginBottom: -16,
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  checkmarkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pendingCircle: {
    shadowColor: '#F59E0B',
  },
  checkmarkIcon: {
    fontSize: 28,
    color: colors.white,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 16,
  },
  headerBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerBadgeText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.white,
    letterSpacing: 1.2,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImageRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageActual: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  profileImagePlaceholder: {
    fontSize: 32,
  },
  profileVerifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 4,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  profileVerifiedIcon: {
    fontSize: 11,
    color: colors.white,
    fontWeight: 'bold',
  },
  registrationCard: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.08)',
  },
  registrationItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  registrationDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 14,
  },
  registrationLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: fonts.bold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  registrationValue: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#1E293B',
    textAlign: 'center',
  },
  detailsSection: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.06)',
  },
  detailsSectionTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    marginBottom: 8,
    color: '#1E293B',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailItem: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.semiBold,
    width: '38%',
  },
  detailValueText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#1E293B',
    width: '62%',
  },
  noDataText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  documentsSection: {
    marginHorizontal: 14,
    marginBottom: 10,
  },
  documentCard: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.06)',
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  documentIcon: {
    fontSize: 20,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#1E293B',
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 10,
    color: '#22C55E',
    fontFamily: fonts.semiBold,
  },
  viewButton: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewButtonGradient: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 11,
    color: colors.white,
    fontFamily: fonts.bold,
  },
  actionButtonsContainer: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 6,
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  enrollNewButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  enrollNewButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  enrollNewButtonText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
  modalCloseButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButtonPlain: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  closeButtonPlainText: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  documentPreviewOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
  },
  documentPreviewBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  documentPreviewContent: {
    backgroundColor: '#FAFBFC',
    borderRadius: 20,
    width: '88%',
    maxHeight: '82%',
    zIndex: 10002,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  documentPreviewScrollView: {
    width: '100%',
    flexGrow: 1,
  },
  documentPreviewScrollContent: {
    padding: 16,
    paddingTop: 44,
    paddingBottom: 24,
    alignItems: 'center',
    flexGrow: 1,
  },
  documentPreviewHeader: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  documentPreviewTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#1E293B',
    marginBottom: 4,
  },
  documentPreviewSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.semiBold,
  },
  documentPreviewImage: {
    width: '100%',
    height: 280,
    borderRadius: 14,
    marginVertical: 12,
    backgroundColor: '#F1F5F9',
  },
  documentPreviewCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10003,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  documentPreviewCloseIcon: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  documentPreviewCloseButton2: {
    backgroundColor: colors.purple1,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 12,
    elevation: 4,
    shadowColor: colors.purple1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  documentPreviewCloseButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  noImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: fonts.semiBold,
  },
  fingerprintGridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 12,
    paddingBottom: 12,
  },
  fingerprintItem: {
    width: '45%',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.08)',
  },
  fingerprintImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  fingerprintLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#334155',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    fontFamily: fonts.semiBold,
    flex: 1,
    lineHeight: 16,
  },
  submitEnrollmentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    marginBottom: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitEnrollmentButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitEnrollmentButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadReportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    marginBottom: 8,
    shadowColor: '#1e3c72',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  downloadReportButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  downloadReportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadReportIcon: {
    fontSize: 18,
  },
  downloadReportButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
});

export default EnrollmentStatusModal;
