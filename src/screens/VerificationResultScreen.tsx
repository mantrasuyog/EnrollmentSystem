import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';

type RootStackParamList = {
  VerificationScreen: undefined;
  VerificationResult: { registrationNumber: string };
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'VerificationResult'>;

const VerificationResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { registrationNumber } = route.params;
  const [isScanning, setIsScanning] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'scanning' | 'success' | 'failed'>('scanning');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simulate scanning process
    const scanTimer = setTimeout(() => {
      setIsScanning(false);
      // Randomly succeed or fail for demo
      const success = Math.random() > 0.3;
      setVerificationStatus(success ? 'success' : 'failed');

      if (success) {
        // Animate success checkmark
        Animated.spring(checkmarkScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
          tension: 40,
        }).start();
      }
    }, 3000);

    // Animate rotate while scanning
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      clearTimeout(scanTimer);
      rotateAnim.setValue(0);
    };
  }, [rotateAnim, checkmarkScaleAnim]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleBackHome = useCallback(() => {
    navigation.navigate('Home' as never);
  }, [navigation]);

  const handleRetry = useCallback(() => {
    setIsScanning(true);
    setVerificationStatus('scanning');
    checkmarkScaleAnim.setValue(0);
    rotateAnim.setValue(0);

    const scanTimer = setTimeout(() => {
      setIsScanning(false);
      const success = Math.random() > 0.3;
      setVerificationStatus(success ? 'success' : 'failed');

      if (success) {
        Animated.spring(checkmarkScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
          tension: 40,
        }).start();
      }
    }, 3000);

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    return () => clearTimeout(scanTimer);
  }, [rotateAnim, checkmarkScaleAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.bgLight} barStyle="dark-content" />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {isScanning ? (
            <>
              <View style={styles.scanningContainer}>
                <Animated.View
                  style={[
                    styles.scanningCircle,
                    { transform: [{ rotate: rotateInterpolate }] },
                  ]}
                >
                  <Text style={styles.scanningIcon}>📸</Text>
                </Animated.View>
                <Text style={styles.scanningTitle}>Scanning Face</Text>
                <Text style={styles.scanningSubtitle}>
                  Please keep your face in frame
                </Text>
                <ActivityIndicator size="large" color={colors.purple1} />
              </View>
            </>
          ) : verificationStatus === 'success' ? (
            <>
              <View style={styles.successContainer}>
                <Animated.View
                  style={[
                    styles.checkmarkContainer,
                    { transform: [{ scale: checkmarkScaleAnim }] },
                  ]}
                >
                  <Text style={styles.checkmark}>✓</Text>
                </Animated.View>
                <Text style={styles.successTitle}>Verification Successful</Text>
                <Text style={styles.successMessage}>
                  Your identity has been verified
                </Text>

                <View style={styles.resultCard}>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Registration Number</Text>
                    <Text style={styles.resultValue}>{registrationNumber}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Status</Text>
                    <Text style={styles.resultStatus}>✓ Verified</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Date & Time</Text>
                    <Text style={styles.resultValue}>
                      {new Date().toLocaleString()}
                    </Text>
                  </View>
                </View>

                <LinearGradient
                  colors={[colors.green1, colors.green2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleBackHome}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>Return to Home</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </>
          ) : (
            <>
              <View style={styles.failureContainer}>
                <View style={styles.failureIconContainer}>
                  <Text style={styles.failureIcon}>✕</Text>
                </View>
                <Text style={styles.failureTitle}>Verification Failed</Text>
                <Text style={styles.failureMessage}>
                  Unable to verify your identity. Please try again.
                </Text>

                <View style={styles.failureReasons}>
                  <Text style={styles.reasonTitle}>Possible reasons:</Text>
                  <View style={styles.reasonItem}>
                    <Text style={styles.reasonBullet}>•</Text>
                    <Text style={styles.reasonText}>Poor lighting conditions</Text>
                  </View>
                  <View style={styles.reasonItem}>
                    <Text style={styles.reasonBullet}>•</Text>
                    <Text style={styles.reasonText}>Face not clearly visible</Text>
                  </View>
                  <View style={styles.reasonItem}>
                    <Text style={styles.reasonBullet}>•</Text>
                    <Text style={styles.reasonText}>Registration number mismatch</Text>
                  </View>
                </View>

                <LinearGradient
                  colors={[colors.purple1, colors.purple2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleRetry}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </LinearGradient>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleBackHome}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Return to Home</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  scanningContainer: {
    alignItems: 'center',
    gap: 16,
  },
  scanningCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.purple1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanningIcon: {
    fontSize: 60,
  },
  scanningTitle: {
    fontSize: 24,
    fontFamily: 'Sen-Bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  scanningSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    marginBottom: 24,
  },
  successContainer: {
    alignItems: 'center',
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 60,
    color: '#4CAF50',
    fontFamily: 'Sen-Bold',
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Sen-Bold',
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  resultItem: {
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    fontFamily: 'Sen-SemiBold',
    color: colors.textDark,
  },
  resultStatus: {
    fontSize: 14,
    fontFamily: 'Sen-SemiBold',
    color: '#4CAF50',
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  failureContainer: {
    alignItems: 'center',
  },
  failureIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  failureIcon: {
    fontSize: 60,
    color: '#FF6B6B',
    fontFamily: 'Sen-Bold',
  },
  failureTitle: {
    fontSize: 24,
    fontFamily: 'Sen-Bold',
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  failureMessage: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  failureReasons: {
    width: '100%',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  reasonTitle: {
    fontSize: 12,
    fontFamily: 'Sen-SemiBold',
    color: colors.textDark,
    marginBottom: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  reasonBullet: {
    fontSize: 14,
    color: '#FF6B6B',
    fontFamily: 'Sen-Bold',
  },
  reasonText: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    flex: 1,
  },
  actionButtonGradient: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.purple1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: colors.purple1,
  },
});

export default VerificationResultScreen;
