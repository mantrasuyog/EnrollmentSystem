import React, { useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  Share,
  Clipboard,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import SuccessCheckmark from "../components/SuccessCheckmark";
import SuccessRegistrationCard from "../components/SuccessRegistrationCard";
import SuccessEnrollmentDetailsCard from "../components/SuccessEnrollmentDetailsCard";
import SuccessInfoCard from "../components/SuccessInfoCard";
import type { RootStackParamList } from "./HomeScreen";
import { colors } from '../common/colors';

const fonts = {
  bold: "Sen-Bold",
  semiBold: "Sen-SemiBold",
  regular: "Sen-Regular",
};

const { width } = Dimensions.get("window");

const SuccessScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const documentPreviewOpacity = useRef(new Animated.Value(0)).current;
  const scans = useSelector((state: RootState) => state.scan.scans);
  const enrolledFaceImage = useSelector((state: RootState) => state.faceEnrollment.enrolledImageBase64);

  const scannedData = useMemo(() => {
    if (!scans || !scans[0]) return null;
    const data = scans[0].scanned_json;

    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    if (Array.isArray(data)) {
      return data;
    }
    return null;
  }, [scans]);

  console.log("Scanned Data:", scannedData);

  const [copied, setCopied] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<{
    type: string;
    title: string;
    image?: string;
  } | null>(null);

  const registrationNumber = scans && scans[0]?.Registration_Number 
    ? scans[0].Registration_Number 
    : "REG-A7X9K2";

  const centerCode = scans && scans[0]?.Centre_Code 
    ? scans[0].Centre_Code 
    : "N/A";

  const enrollmentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotateInterpolate = useMemo(() => rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  }), [rotateAnim]);

  const handleCopyRegistration = useCallback(async () => {
    await Clipboard.setString(registrationNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [registrationNumber]);

  const handleShare = useCallback(async () => {
    await Share.share({
      message: `My registration number is: ${registrationNumber}`,
      title: "Registration Confirmation",
    });
  }, [registrationNumber]);

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [modalOpacity]);

  const handleCloseModal = useCallback(() => {
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowModal(false));
  }, [modalOpacity]);

  const handleOpenDocumentPreview = useCallback((documentType: string, title: string, imageUri?: string) => {
    setSelectedDocument({ type: documentType, title, image: imageUri });
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
      case "id":
        return scans?.[0]?.Document_Image;
      case "photo":
        return enrolledFaceImage ? `data:image/jpeg;base64,${enrolledFaceImage}` : scans?.[0]?.Portrait_Image;
      case "fingerprint":
        return (scans?.[0] as any)?.Fingerprint_Image;
      default:
        return selectedDocument.image;
    }
  }, [selectedDocument, scans, enrolledFaceImage]);

  const documents = useMemo(() => [
    { icon: "🆔", name: "ID Proof", type: "id" },
    { icon: "📷", name: "Photo Proof", type: "photo" },
    { icon: "🏠", name: "Finger Proof", type: "fingerprint" },
  ], []);

  const handleBackToHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.bgLight} barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.decorativeCircle1,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          <View style={styles.gradientCircle1} />
        </Animated.View>

        <Animated.View
          style={[
            styles.decorativeCircle2,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          <View style={styles.gradientCircle2} />
        </Animated.View>

        <SuccessCheckmark
          scaleAnim={scaleAnim}
          bounceAnim={bounceAnim}
          blinkAnim={blinkAnim}
          pulseAnim={pulseAnim}
        />

        <Animated.View
          style={[
            styles.headingContainer,
            { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.mainHeading}>Enrollment Successful!</Text>
          <Text style={styles.subHeading}>
            Your enrollment is completed successfully. You're all set to begin
            your journey with us.
          </Text>
        </Animated.View>

        <SuccessRegistrationCard
          registrationNumber={registrationNumber}
          copied={copied}
          opacityAnim={opacityAnim}
          slideAnim={slideAnim}
          onCopy={handleCopyRegistration}
          onShare={handleShare}
        />

        <Animated.View
          style={[
            styles.detailsButtonContainer,
            { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity onPress={handleOpenModal} style={styles.detailsButton}>
            <Text style={styles.detailsButtonIcon}>📄</Text>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.detailsButtonText}>Check Enrolled Details</Text>
              <Text style={styles.detailsButtonSubtext}>
                View your documents & information
              </Text>
            </View>
            <Text style={styles.detailsButtonArrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        <SuccessEnrollmentDetailsCard
          enrollmentDate={enrollmentDate}
          centerCode={centerCode}
          opacityAnim={opacityAnim}
          slideAnim={slideAnim}
        />

        <Animated.View
          style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}
        >
          <SuccessInfoCard
            icon="ℹ️"
            title="Keep This Safe"
            description="Save your registration number for future support, course access, and certificate claims."
            backgroundColor={colors.infoBg1}
            borderColor={colors.infoBorder1}
            iconBgColor={colors.bluePrimary}
          />

          <SuccessInfoCard
            icon="🎧"
            title="Need Help?"
            description="Our support team is available 24/7. Email: support@mantraidentity.com"
            backgroundColor={colors.infoBg2}
            borderColor={colors.infoBorder2}
            iconBgColor={colors.violet1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonsContainer,
            { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity style={styles.primaryButtonWrapper} onPress={handleBackToHome}>
            <View style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Back To Home</Text>
              <Text style={styles.primaryButtonIcon}>→</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {showModal && (
        <Animated.View
          style={[styles.modalOverlay, { opacity: modalOpacity }]}
        >
          <TouchableOpacity style={styles.modalBackground} onPress={handleCloseModal} />

          <Animated.View style={[styles.modalContent, { opacity: modalOpacity }]}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Enrollment Details</Text>
                <Text style={styles.modalSubtitle}>Your Information & Documents</Text>
              </View>

              <View style={styles.profileImageContainer}>
                {enrolledFaceImage ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${enrolledFaceImage}` }}
                    style={styles.profileImageActual}
                  />
                ) : (
                  <View style={styles.profileImage}>
                    <Text style={styles.profileImagePlaceholder}>👤</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Basic Information</Text>

                {scannedData && Array.isArray(scannedData) && scannedData.length > 0 ? (
                  scannedData.map((item, index) => (
                    <View key={index} style={styles.detailItem}>
                      <Text style={styles.detailLabel}>{item.name}</Text>
                      <Text style={styles.detailValueText}>{item.value}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailValueText}>No enrollment data available</Text>
                )}
              </View>

              <View style={styles.documentsSection}>
                <Text style={styles.detailsSectionTitle}>Uploaded Documents</Text>

                {documents.map(({ icon, name, type }) => (
                  <View key={name} style={styles.documentCard}>
                    <View style={styles.documentIconContainer}>
                      <Text style={styles.documentIcon}>{icon}</Text>
                    </View>

                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{name}</Text>
                      <Text style={styles.documentStatus}>✓ Verified</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => handleOpenDocumentPreview(type, name)}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}

      {showDocumentPreview && selectedDocument && (
        <Animated.View
          style={[styles.documentPreviewOverlay, { opacity: documentPreviewOpacity }]}
        >
          <TouchableOpacity 
            style={styles.documentPreviewBackground} 
            onPress={handleCloseDocumentPreview} 
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
                  source={{ uri: getDocumentImage() }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 24 },

  decorativeCircle1: {
    position: "absolute",
    top: 40,
    right: 16,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.08,
  },

  gradientCircle1: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    backgroundColor: colors.purple1,
  },

  decorativeCircle2: {
    position: "absolute",
    bottom: 80,
    left: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.08,
  },

  gradientCircle2: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    backgroundColor: colors.pink3,
  },

  headingContainer: { alignItems: "center", marginBottom: 20 },
  mainHeading: {
    fontSize: 22,
    color: colors.darkText,
    marginBottom: 8,
    fontFamily: fonts.bold,
  },
  subHeading: {
    fontSize: 13,
    width: width * 0.75,
    fontFamily: fonts.regular,
    textAlign: "center",
    color: colors.midGray,
  },

  detailsButtonContainer: { marginVertical: 14 },
  detailsButton: {
    backgroundColor: colors.grayLight2,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.borderGray,
  },

  detailsButtonIcon: { fontSize: 22 },
  detailsButtonText: { fontSize: 14, fontFamily: fonts.bold },
  detailsButtonSubtext: { fontSize: 11, color: colors.midGray,fontFamily: fonts.regular},
  detailsButtonArrow: { fontSize: 18, marginLeft: "auto" },

  detailLabel: { fontSize: 11, color: colors.placeholderGray,fontFamily: fonts.regular},

  buttonsContainer: { marginTop: 16, gap: 10 },

  primaryButtonWrapper: {
    borderRadius: 10,
    elevation: 4,
    overflow: "hidden",
  },

  primaryButton: {
    backgroundColor: colors.green1,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: { color: colors.white, fontSize: 14, fontFamily: fonts.bold },
  primaryButtonIcon: { color: colors.white, fontSize: 16 },

  secondaryButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderGray,
  },

  secondaryButtonText: { fontSize: 14, fontFamily: fonts.bold },

  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
  },

  modalBackground: { flex: 1, backgroundColor: colors.overlayBlack60 },

  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  closeButton: {
    position: "absolute",
    top: 10,
    right: 12,
    padding: 6,
    backgroundColor: colors.grayLight2,
    borderRadius: 16,
    zIndex: 20,
  },

  closeIcon: { fontSize: 16 },

  modalScrollView: { paddingTop: 32, paddingBottom: 16 },

  modalHeader: { marginBottom: 12 },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold },
  modalSubtitle: { fontSize: 12, color: colors.midGray,fontFamily: fonts.regular },

  profileImageContainer: { alignItems: "center", marginVertical: 12 },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.grayLight2,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageActual: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: colors.purple1,
  },
  profileImagePlaceholder: { fontSize: 36 },

  detailsSection: { marginBottom: 18, width: '100%' },
  detailsSectionTitle: { fontSize: 14, fontFamily: fonts.bold, marginBottom: 8 },

  detailItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight2,
  },

  detailValueText: { fontSize: 13, fontFamily: fonts.bold, color: colors.darkText },

  documentsSection: { paddingBottom: 18 },
  documentCard: {
    backgroundColor: colors.bgLight,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    marginBottom: 10,
  },

  documentIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.grayLight2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  documentIcon: { fontSize: 18 },
  documentInfo: { flex: 1 },
  documentName: { fontSize: 13, fontFamily: fonts.semiBold },
  documentStatus: { fontSize: 11, color: colors.green1,fontFamily: fonts.semiBold },

  viewButton: { padding: 5, paddingHorizontal: 10 },
  viewButtonText: { fontSize: 12, color: colors.blue600,fontFamily: fonts.semiBold,backgroundColor:colors.blueLightBg,borderRadius:4 ,padding:4 },

  modalCloseButton: {
    backgroundColor: colors.green1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 50,
  },

  modalCloseButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
  },

  documentPreviewOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },

  documentPreviewBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlayBlack80,
  },

  documentPreviewContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: "85%",
    maxHeight: "70%",
    zIndex: 101,
    overflow: "hidden",
  },

  documentPreviewScrollView: {
    width: "100%",
  },

  documentPreviewScrollContent: {
    padding: 12,
    paddingTop: 36,
    alignItems: "center",
  },

  documentPreviewHeader: {
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
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
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginVertical: 10,
  },

  documentPreviewCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
    backgroundColor: colors.grayLight2,
    borderRadius: 16,
    zIndex: 102,
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
    alignSelf: "center",
    marginTop: 6,
  },

  documentPreviewCloseButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
  },

  noImageContainer: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    backgroundColor: colors.grayLight2,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },

  noImageText: {
    fontSize: 14,
    color: colors.placeholderGray,
    fontFamily: fonts.semiBold,
  },
});

export default SuccessScreen;