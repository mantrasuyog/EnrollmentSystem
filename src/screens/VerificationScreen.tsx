import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';

type RootStackParamList = {
  Home: undefined;
  Verification: undefined;
  VerificationResult: { registrationNumber: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Verification'>;

const VerificationScreen: React.FC<Props> = ({ navigation }) => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, slideAnim, opacityAnim]);

  const validateRegistrationNumber = useCallback(() => {
    if (!registrationNumber.trim()) {
      setError('Please enter registration number');
      return false;
    }
    if (!/^\d{6}$/.test(registrationNumber)) {
      setError('Registration number must be exactly 6 digits');
      return false;
    }
    setError('');
    return true;
  }, [registrationNumber]);

  const handleStartScan = useCallback(async () => {
    if (!validateRegistrationNumber()) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to verification result screen with registration number
      navigation.navigate('VerificationResult' as never, {
        registrationNumber,
      } as never);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [registrationNumber, validateRegistrationNumber, navigation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleClear = useCallback(() => {
    setRegistrationNumber('');
    setError('');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.bgLight} barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Identity Verification</Text>
            <View style={styles.placeholderButton} />
          </View>

          <View style={styles.iconContainer}>
            <Text style={styles.headerIcon}>🛡️</Text>
          </View>

          <Text style={styles.subtitle}>
            Verify Your Identity
          </Text>
          <Text style={styles.description}>
            Enter your registration number to proceed with identity verification
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: opacityAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Registration Number</Text>
            <View style={[styles.inputContainer, error && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit number"
                placeholderTextColor={colors.textGray}
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                editable={!isLoading}
                maxLength={6}
                keyboardType="numeric"
              />
              {registrationNumber.length > 0 && !isLoading && (
                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Text style={styles.helperText}>
              You can find this number in your enrollment confirmation email
            </Text>
          </View>

          <LinearGradient
            colors={[colors.purple1, colors.purple2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanButtonGradient}
          >
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleStartScan}
              disabled={isLoading || !registrationNumber.trim()}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text style={styles.scanButtonIcon}>📸</Text>
                  <Text style={styles.scanButtonText}>Start Scan</Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Verification Process</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>1. Face Recognition</Text>
              <Text style={styles.infoText}>
                We'll scan your face for identity verification
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>2. Result</Text>
              <Text style={styles.infoText}>
                Get instant verification status
              </Text>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 32,
    fontFamily: 'Sen-SemiBold',
    color: colors.purple1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: colors.textDark,
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: 50,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 60,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: 'Sen-Bold',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Sen-SemiBold',
    color: colors.textDark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.textDark,
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: colors.textGray,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    lineHeight: 16,
  },
  scanButtonGradient: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  scanButtonIcon: {
    fontSize: 20,
  },
  scanButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.purple1,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontFamily: 'Sen-Bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoBullet: {
    fontSize: 13,
    fontFamily: 'Sen-SemiBold',
    color: colors.purple1,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    lineHeight: 16,
  },
});

export default VerificationScreen;
