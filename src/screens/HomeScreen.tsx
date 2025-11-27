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
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../redux/store';
import { clearScanData } from '../redux/scanSlice';
import { clearEnrolledImage } from '../redux/faceEnrollmentSlice';
import HeroSection from '../components/HeroSection';
import HomeActionCard from '../components/HomeActionCard';
import SecurityFooter from '../components/SecurityFooter';
import EnrollmentStatusModal from '../components/EnrollmentStatusModal';
import { colors } from '../common/colors';

export type RootStackParamList = {
  Home: undefined;
  DocumentUpload: undefined;
  Verification: undefined;
  VerificationScreen: undefined;
  VerificationResult: { registrationNumber: string };
  Success: undefined;
  FaceAndFingerEnrollment: undefined;
  FaceRecongition: undefined;
  DashboardScreen: undefined;
  SplashScreen: undefined;
  FingerCapture: undefined;
  faceCapture: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const isDarkMode = useColorScheme() === 'dark';
  const dispatch = useDispatch();
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  const scanData = useSelector((state: RootState) => state.scan.scans[0]);
  const faceImage = useSelector((state: RootState) => state.faceEnrollment.enrolledImageBase64);

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

  const handleEnrollmentPress = useCallback(() => {
    if (scanData || faceImage) {
      setShowEnrollmentModal(true);
    } else {
      (navigation as any).navigate('DashboardScreen');
    }
  }, [navigation, scanData, faceImage]);

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
    (navigation as any).navigate('VerificationScreen');
  }, [navigation]);

  const handleEnrollNew = useCallback(() => {
    dispatch(clearScanData());
    dispatch(clearEnrolledImage());
    setShowEnrollmentModal(false);
    (navigation as any).navigate('DashboardScreen');
  }, [dispatch, navigation]);

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

        <EnrollmentStatusModal
          visible={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
          onEnrollNew={handleEnrollNew}
          enrollmentData={{
            scanData: scanData,
            faceImage: faceImage || undefined,
          }}
        />

        {/* <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.optionsTitle, isDarkMode && styles.textDark]}>
            Choose an option to continue
          </Text>
        </Animated.View> */}

        <View style={styles.cardsContainer}>
          {/* <HomeActionCard
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
          /> */}

          <HomeActionCard
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
          />
        </View>

        <SecurityFooter
          fadeAnim={fadeAnim}
          isDarkMode={isDarkMode}
        />
      </View>
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
});

export default HomeScreen;