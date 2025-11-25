import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';

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
  };
}

const EnrollmentStatusModal: React.FC<EnrollmentStatusModalProps> = ({
  visible,
  onClose,
  onEnrollNew,
  enrollmentData,
}) => {
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const documentPreviewOpacity = useRef(new Animated.Value(0)).current;

  const [showDocumentPreview, setShowDocumentPreview] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<{
    type: string;
    title: string;
    image?: string;
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
        ])
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

  const handleOpenDocumentPreview = useCallback((documentType: string, title: string) => {
    setSelectedDocument({ type: documentType, title });
    setShowDocumentPreview(true);
    Animated.timing(documentPreviewOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [documentPreviewOpacity]);

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
        const fingerprintImage = (enrollmentData.scanData as any)?.Fingerprint_Image;
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
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
          <LinearGradient
            colors={[colors.purple1, colors.purple2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.checkmarkCircle}>
                <Text style={styles.checkmarkIcon}>✓</Text>
              </View>
            </Animated.View>
            <Text style={styles.modalTitle}>Enrollment Complete!</Text>
            <Text style={styles.modalSubtitle}>Your biometric data is already registered</Text>
          </LinearGradient>

          <View style={styles.profileImageContainer}>
            {enrollmentData.faceImage ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${enrollmentData.faceImage}` }}
                style={styles.profileImageActual}
              />
            ) : enrollmentData.scanData?.Portrait_Image ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${enrollmentData.scanData.Portrait_Image}` }}
                style={styles.profileImageActual}
              />
            ) : (
              <View style={styles.profileImage}>
                <Text style={styles.profileImagePlaceholder}>👤</Text>
              </View>
            )}
          </View>

          <View style={styles.registrationCard}>
            <View style={styles.registrationItem}>
              <Text style={styles.registrationLabel}>Registration Number</Text>
              <Text style={styles.registrationValue}>
                {enrollmentData.scanData?.Registration_Number || 'N/A'}
              </Text>
            </View>
            <View style={styles.registrationItem}>
              <Text style={styles.registrationLabel}>Centre Code</Text>
              <Text style={styles.registrationValue}>
                {enrollmentData.scanData?.Centre_Code || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Basic Information</Text>

            {enrollmentData.scanData?.Name && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Full Name:</Text>
                <Text style={styles.detailValueText}>{enrollmentData.scanData.Name}</Text>
              </View>
            )}

            {scannedData && scannedData.length > 0 ? (
              scannedData.map((item: any, index: number) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{item.name}:</Text>
                  <Text style={styles.detailValueText}>{item.value}</Text>
                </View>
              ))
            ) : null}

            {(!scannedData || scannedData.length === 0) && !enrollmentData.scanData?.Name && (
              <Text style={styles.noDataText}>No enrollment data available</Text>
            )}
          </View>

          <View style={styles.documentsSection}>
            <Text style={styles.detailsSectionTitle}>Enrolled Documents</Text>

            {enrollmentData.scanData?.Document_Image && (
              <View style={styles.documentCard}>
                <View style={styles.documentIconContainer}>
                  <Text style={styles.documentIcon}>🆔</Text>
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>ID Document</Text>
                  <Text style={styles.documentStatus}>✓ Verified</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleOpenDocumentPreview('id', 'ID Document')}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            )}

            {enrollmentData.scanData?.Portrait_Image && (
              <View style={styles.documentCard}>
                <View style={styles.documentIconContainer}>
                  <Text style={styles.documentIcon}>📷</Text>
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Portrait Photo</Text>
                  <Text style={styles.documentStatus}>✓ Verified</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleOpenDocumentPreview('photo', 'Portrait Photo')}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            )}

            {enrollmentData.faceImage && (
              <View style={styles.documentCard}>
                <View style={styles.documentIconContainer}>
                  <Text style={styles.documentIcon}>😊</Text>
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Face Enrollment</Text>
                  <Text style={styles.documentStatus}>✓ Verified</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleOpenDocumentPreview('face', 'Face Enrollment')}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            )}

            {(enrollmentData.scanData as any)?.Fingerprint_Image && (
              <View style={styles.documentCard}>
                <View style={styles.documentIconContainer}>
                  <Text style={styles.documentIcon}>👆</Text>
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Fingerprint</Text>
                  <Text style={styles.documentStatus}>✓ Verified</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleOpenDocumentPreview('fingerprint', 'Fingerprint')}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.enrollNewButton} onPress={onEnrollNew}>
              <LinearGradient
                colors={[colors.green1, colors.green2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.enrollNewButtonGradient}
              >
                <Text style={styles.enrollNewButtonText}>Enroll New Documents</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <View style={styles.closeButtonPlain}>
                <Text style={styles.closeButtonPlainText}>Close</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {showDocumentPreview && selectedDocument && (
        <Animated.View
          style={[styles.documentPreviewOverlay, { opacity: documentPreviewOpacity }]}
        >
          <TouchableOpacity
            style={styles.documentPreviewBackground}
            onPress={handleCloseDocumentPreview}
            activeOpacity={1}
          />

          <Animated.View style={[styles.documentPreviewContent, { opacity: documentPreviewOpacity }]}>
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
                <Text style={styles.documentPreviewTitle}>Document Preview</Text>
                <Text style={styles.documentPreviewSubtitle}>{selectedDocument.title}</Text>
              </View>

              {getDocumentImage() ? (
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
    backgroundColor: colors.overlayBlack60,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: screenWidth * 0.9,
    maxHeight: '85%',
    paddingBottom: 10,
    zIndex: 10000,
    elevation: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 12,
    padding: 8,
    backgroundColor: colors.grayLight2,
    borderRadius: 20,
    zIndex: 20,
    elevation: 5,
  },
  closeIcon: {
    fontSize: 18,
    color: colors.darkText,
    fontWeight: 'bold',
  },
  modalScrollView: {
    paddingTop: 16,
  },
  gradientHeader: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmarkCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.green1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 8,
    shadowColor: colors.green1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  checkmarkIcon: {
    fontSize: 28,
    color: colors.white,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.white80,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.grayLight2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.purple1,
  },
  profileImageActual: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.purple1,
  },
  profileImagePlaceholder: {
    fontSize: 28,
  },
  registrationCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.bgLight,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  registrationItem: {
    marginBottom: 8,
  },
  registrationLabel: {
    fontSize: 10,
    color: colors.placeholderGray,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  registrationValue: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.darkText,
  },
  detailsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 8,
    color: colors.darkText,
  },
  detailItem: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailLabel: {
    fontSize: 11,
    color: colors.placeholderGray,
    fontFamily: fonts.semiBold,
    width: '40%',
  },
  detailValueText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.darkText,
    width: '60%',
  },
  noDataText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.placeholderGray,
    textAlign: 'center',
    paddingVertical: 12,
  },
  documentsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  documentCard: {
    backgroundColor: colors.bgLight,
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.borderGray,
    alignItems: 'center',
  },
  documentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  documentIcon: {
    fontSize: 18,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.darkText,
    marginBottom: 1,
  },
  documentStatus: {
    fontSize: 10,
    color: colors.green1,
    fontFamily: fonts.semiBold,
  },
  viewButton: {
    padding: 4,
    paddingHorizontal: 8,
  },
  viewButtonText: {
    fontSize: 11,
    color: colors.blue600,
    fontFamily: fonts.semiBold,
    backgroundColor: colors.blueLightBg,
    borderRadius: 4,
    padding: 3,
  },
  actionButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  enrollNewButton: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
  },
  enrollNewButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  enrollNewButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  modalCloseButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  closeButtonPlain: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.grayLight2,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 10,
  },
  closeButtonPlainText: {
    color: colors.darkText,
    fontSize: 14,
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
    backgroundColor: colors.overlayBlack80,
  },
  documentPreviewContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    zIndex: 10002,
    overflow: 'hidden',
  },
  documentPreviewScrollView: {
    width: '100%',
  },
  documentPreviewScrollContent: {
    padding: 12,
    paddingTop: 36,
    alignItems: 'center',
  },
  documentPreviewHeader: {
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  documentPreviewTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.darkText,
    marginBottom: 3,
  },
  documentPreviewSubtitle: {
    fontSize: 12,
    color: colors.midGray,
    fontFamily: fonts.semiBold,
  },
  documentPreviewImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginVertical: 10,
  },
  documentPreviewCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    backgroundColor: colors.grayLight2,
    borderRadius: 16,
    zIndex: 10003,
  },
  documentPreviewCloseIcon: {
    fontSize: 16,
    color: colors.darkText,
    fontFamily: fonts.bold,
  },
  documentPreviewCloseButton2: {
    backgroundColor: colors.green1,
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 6,
  },
  documentPreviewCloseButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  noImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: colors.grayLight2,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  noImageText: {
    fontSize: 14,
    color: colors.placeholderGray,
    fontFamily: fonts.semiBold,
  },
});

export default EnrollmentStatusModal;
