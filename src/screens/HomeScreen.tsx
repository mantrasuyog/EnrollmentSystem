import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  StatusBar,
  Animated,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '../services/api.service';

const { width: screenWidth } = Dimensions.get('window');
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { clearScanData, addScanData } from '../redux/scanSlice';
import { clearEnrolledImage, setEnrolledImage } from '../redux/faceEnrollmentSlice';
import { clearFingerEnrollment, selectFingerTemplates, setFingerTemplate, FingerKey, selectFingerTemplatesForApi } from '../redux/fingerEnrollmentSlice';
import { selectUserEnrolled, setUserEnrolled, resetUserEnrollment } from '../redux/userEnrollmentSlice';
import HeroSection from '../components/HeroSection';
import HomeActionCard from '../components/HomeActionCard';
import SecurityFooter from '../components/SecurityFooter';
import EnrollmentStatusModal from '../components/EnrollmentStatusModal';
import { colors } from '../common/colors';
import {
  getScanData,
  getFaceEnrollment,
  getFingerTemplates,
  getUserEnrollmentStatus,
  clearAllEnrollmentData,
} from '../services/database.service';

export type RootStackParamList = {
  Home: undefined;
  DocumentUpload: undefined;
  Verification: undefined;
  Success: undefined;
  FaceAndFingerEnrollment: undefined;
  FaceRecongition: undefined;
  DashboardScreen: undefined;
  SplashScreen: undefined;
  FingerCapture: undefined;
  FaceCapture: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const isDarkMode = useColorScheme() === 'dark';
  const dispatch = useDispatch();
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false);

  // Get data from Redux
  const reduxScanData = useSelector((state: RootState) => state.scan.scans[0]);
  const reduxFaceImage = useSelector((state: RootState) => state.faceEnrollment.enrolledImageBase64);
  const reduxFingerTemplates = useSelector(selectFingerTemplates);
  const reduxFingerTemplatesForApi = useSelector(selectFingerTemplatesForApi);
  const isUserEnrolled = useSelector(selectUserEnrolled);

  // Check if Redux has any data
  const hasReduxFingerprints = Object.values(reduxFingerTemplates).some(template => template !== null);
  const hasReduxData = !!(reduxScanData || reduxFaceImage || hasReduxFingerprints);

  // Sync SQLite data to Redux on screen focus if Redux is empty
  useEffect(() => {
    const syncSQLiteToRedux = () => {
      // If Redux already has data, no need to sync
      if (hasReduxData) {
        if (__DEV__) {
          console.log('Redux has data, skipping SQLite sync');
        }
        return;
      }

      // Check SQLite and sync to Redux if data exists
      const sqliteScan = getScanData();
      const sqliteFace = getFaceEnrollment();
      const sqliteFingers = getFingerTemplates();

      if (__DEV__) {
        console.log('Checking SQLite for data...', {
          hasScan: !!sqliteScan,
          hasFace: !!sqliteFace,
          hasFingers: Object.values(sqliteFingers).some(t => t !== null),
        });
      }

      // Sync scan data to Redux
      if (sqliteScan) {
        dispatch(addScanData({
          Registration_Number: sqliteScan.registration_number,
          Name: sqliteScan.name,
          Portrait_Image: sqliteScan.portrait_image,
          Document_Image: sqliteScan.document_image,
          scanned_json: sqliteScan.scanned_json,
          Centre_Code: sqliteScan.centre_code,
        }));
        if (__DEV__) {
          console.log('Synced scan data from SQLite to Redux');
        }
      }

      // Sync face enrollment to Redux
      if (sqliteFace) {
        dispatch(setEnrolledImage(sqliteFace));
        if (__DEV__) {
          console.log('Synced face data from SQLite to Redux');
        }
      }

      // Sync finger templates to Redux
      const fingerKeys: FingerKey[] = [
        'left_thumb', 'left_index', 'left_middle', 'left_ring', 'left_little',
        'right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_little',
      ];

      fingerKeys.forEach((key) => {
        const template = sqliteFingers[key];
        if (template) {
          dispatch(setFingerTemplate({
            key,
            template: {
              title: template.title,
              base64Image: template.base64Image,
            },
          }));
        }
      });

      if (Object.values(sqliteFingers).some(t => t !== null)) {
        if (__DEV__) {
          console.log('Synced finger templates from SQLite to Redux');
        }
      }

      // Sync user enrollment status from SQLite
      const sqliteUserEnrolled = getUserEnrollmentStatus();
      if (sqliteUserEnrolled) {
        dispatch(setUserEnrolled(true));
        if (__DEV__) {
          console.log('Synced user enrollment status from SQLite to Redux');
        }
      }
    };

    syncSQLiteToRedux();

    // Also sync when screen comes into focus
    const unsubscribe = navigation.addListener('focus', syncSQLiteToRedux);
    return unsubscribe;
  }, [navigation, hasReduxData, dispatch]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const scaleAnim1 = useRef(new Animated.Value(0.9)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim1, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim2, {
        toValue: 0,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim1, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim2, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, slideAnim1, slideAnim2, scaleAnim1, scaleAnim2, pulseAnim, rotateAnim]);

  const handlePressIn = useCallback((scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback((scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Check if all enrollment data is complete (scan, face, and fingerprints)
  const hasCompleteEnrollmentData = !!(reduxScanData && reduxFaceImage && hasReduxFingerprints);

  const handleEnrollmentPress = useCallback(async () => {
    // Case 1: User is already enrolled - call API to verify on server
    if (isUserEnrolled && hasCompleteEnrollmentData && reduxScanData?.Registration_Number) {
      setIsCheckingEnrollment(true);
      try {
        const response = await apiService.checkUserExists(reduxScanData.Registration_Number);
        // Check if user exists on server (status is 'success' and no "does not exist" message)
        const userDoesNotExist = response.status !== 'success' ||
          (response.message && response.message.toLowerCase().includes('does not exist'));

        if (!userDoesNotExist) {
          // User exists on server, show enrollment status modal
          setShowEnrollmentModal(true);
        } else {
          // User doesn't exist on server - clear all data and proceed with new enrollment
          if (__DEV__) {
            console.log('User does not exist on server, clearing all data:', response.message);
          }
          // Clear Redux data
          dispatch(clearScanData());
          dispatch(clearEnrolledImage());
          dispatch(clearFingerEnrollment());
          dispatch(resetUserEnrollment());
          // Clear SQLite data
          clearAllEnrollmentData();
          (navigation as any).navigate('DashboardScreen');
        }
      } catch (error) {
        // API call failed (e.g., 404 user not found), clear all data and proceed with new enrollment
        if (__DEV__) {
          console.log('User not found or API error, clearing all data and proceeding with new enrollment:', error);
        }
        // Clear Redux data
        dispatch(clearScanData());
        dispatch(clearEnrolledImage());
        dispatch(clearFingerEnrollment());
        dispatch(resetUserEnrollment());
        // Clear SQLite data
        clearAllEnrollmentData();
        (navigation as any).navigate('DashboardScreen');
      } finally {
        setIsCheckingEnrollment(false);
      }
    }
    // Case 2: Has local enrollment data but not yet enrolled (pending) - show modal without API call
    else if (hasCompleteEnrollmentData) {
      setShowEnrollmentModal(true);
    }
    // Case 3: No enrollment data - proceed to new enrollment
    else {
      (navigation as any).navigate('DashboardScreen');
    }
  }, [navigation, hasCompleteEnrollmentData, isUserEnrolled, reduxScanData?.Registration_Number, dispatch]);

  const handlePressInCard1 = useCallback(() => {
    handlePressIn(scaleAnim1);
  }, [handlePressIn, scaleAnim1]);

  const handlePressOutCard1 = useCallback(() => {
    handlePressOut(scaleAnim1);
  }, [handlePressOut, scaleAnim1]);

  const handlePressInCard2 = useCallback(() => {
    handlePressIn(scaleAnim2);
  }, [handlePressIn, scaleAnim2]);

  const handlePressOutCard2 = useCallback(() => {
    handlePressOut(scaleAnim2);
  }, [handlePressOut, scaleAnim2]);

  const handleVerificationPress = useCallback(() => {

  }, []);

  const handleEnrollNew = useCallback(() => {
    // Clear Redux data
    dispatch(clearScanData());
    dispatch(clearEnrolledImage());
    dispatch(clearFingerEnrollment());
    dispatch(resetUserEnrollment());
    // Clear SQLite data
    clearAllEnrollmentData();
    setShowEnrollmentModal(false);
    (navigation as any).navigate('DashboardScreen');
  }, [dispatch, navigation]);

  const handleEnrollmentSuccess = useCallback(() => {
    setShowEnrollmentModal(false);
    (navigation as any).navigate('Success');
  }, [navigation]);

  const spin = useMemo(() => rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  }), [rotateAnim]);

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
      <StatusBar
        backgroundColor={colors.bgLight}
        barStyle="dark-content"
      />
      <View style={styles.container}>
        <HeroSection
          fadeAnim={fadeAnim}
          pulseAnim={pulseAnim}
          isDarkMode={isDarkMode}
        />

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.optionsTitle, isDarkMode && styles.textDark]}>
            Choose an option to continue
          </Text>
        </Animated.View>

        <View style={styles.cardsContainer}>
          <HomeActionCard
            title="New Enrollment"
            description="Register your fingerprint, face, or iris data securely in our encrypted database for seamless authentication"
            icon="✍️"
            buttonText="Get Started"
            gradientColors={[colors.purple1, colors.purple2]}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim1}
            scaleAnim={scaleAnim1}
            onPress={handleEnrollmentPress}
            onPressIn={handlePressInCard1}
            onPressOut={handlePressOutCard1}
          />

          {/* <HomeActionCard
            title="Identity Verification"
            description="Authenticate your identity instantly using your enrolled biometric credentials with military-grade security"
            icon="🛡️"
            buttonText="Verify Now"
            gradientColors={[colors.pink1, colors.pink2]}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim2}
            scaleAnim={scaleAnim2}
            onPress={handleVerificationPress}
            onPressIn={handlePressInCard2}
            onPressOut={handlePressOutCard2}
            iconAnimation={spin}
          /> */}
        </View>

        <SecurityFooter
          fadeAnim={fadeAnim}
          isDarkMode={isDarkMode}
        />
      </View>

      <EnrollmentStatusModal
        visible={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        onEnrollNew={handleEnrollNew}
        onEnrollmentSuccess={handleEnrollmentSuccess}
        isUserEnrolled={isUserEnrolled}
        fingerTemplatesForApi={reduxFingerTemplatesForApi}
        enrollmentData={{
          scanData: reduxScanData ? {
            Registration_Number: reduxScanData.Registration_Number,
            Name: reduxScanData.Name,
            Portrait_Image: reduxScanData.Portrait_Image,
            Document_Image: reduxScanData.Document_Image,
            scanned_json: reduxScanData.scanned_json,
            Centre_Code: reduxScanData.Centre_Code,
          } : undefined,
          faceImage: reduxFaceImage || undefined,
          fingerTemplates: hasReduxFingerprints ? reduxFingerTemplates : undefined,
        }}
      />

      {isCheckingEnrollment && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.purple1} />
            <Text style={styles.loadingText}>Checking enrollment status...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  safeAreaDark: {
    backgroundColor: colors.bgDark,
  },
  container: {
    flex: 1,
    marginTop: 15,
    paddingHorizontal: Math.min(24, screenWidth * 0.05),
    paddingVertical: 15,
  },
  optionsTitle: {
    fontSize: Math.min(16, screenWidth * 0.038),
    fontFamily: 'Sen-SemiBold',
    color: colors.darkText,
    marginBottom: 15,
    marginTop: 15,
    textAlign: 'center',
  },
  textDark: {
    color: colors.white,
    fontFamily: 'Sen-SemiBold',
  },
  cardsContainer: {
    gap: Math.min(16, screenWidth * 0.035),
    paddingVertical: 15,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContainer: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Sen-Medium',
    color: colors.darkText,
  },
});

export default HomeScreen;