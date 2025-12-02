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
import { apiService } from '../services/api.service';

type RootStackParamList = {
  Home: undefined;
  Verification: undefined;
  VerificationResult: { registrationNumber: string };
  FaceCapture: { registrationNumber?: string ;
    userDetails: {
      name: string;
      registrationId: string;
      centerCode: string;
      scannedJson?: Record<string, any>;
    };
  };
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
    // Validate registration number
    if (!registrationNumber.trim()) {
      setError('Please enter registration number');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      console.log('registration number>>', registrationNumber);
      const { exists, userData } = await checkUser(registrationNumber);

      if (exists && userData) {
        // Extract only the required fields
        const { 
          name, 
          registration_id, 
          center_code,
          scanned_json 
        } = userData;

        const userDetails = {
          name,
          registrationId: registration_id,
          centerCode: center_code,
          scannedJson: scanned_json // Pass the entire scanned_json object
        };

        // Navigate with user details including full scanned_json
        navigation.navigate('FaceCapture', { 
          registrationNumber,
          userDetails 
        });
      } else {
        setError('User not found');
        // navigation.navigate('FaceCapture');
      }
    } catch (err: any) {
      console.log('error>',err);
      
      let message = 'An error occurred. Please try again.';
      if (err && err.response && err.response.data) {
        // Prefer server-provided message
        message = err.response.data.message || JSON.stringify(err.response.data);
      } else if (err && err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [registrationNumber, navigation]);
const checkUser = async (registrationNumber: string): Promise<{exists: boolean, userData?: any}> => {
  console.log('registration number>>.', registrationNumber);
  
  try {
    const url = `http://10.65.21.96:8000/api/v1/users/${registrationNumber}`;
    console.log('calling url>>', url);

    // Use axios via apiService for consistent interceptors and error handling
    const response = await apiService.get(url);
    console.log('api response status:', response.status, 'name>>', response.data.name);

    return {
      exists: response && response.status === 200,
      userData: response.data
    };
  } catch (error: any) {
    // axios errors: error.response contains server response
    if (error && error.response) {
      console.log('API response error:', error.response.status, error.response.data);
      if (error.response.status === 404) return {
      exists: false
    };
      // forward server message as error for calling code to show
      const msg = error.response.data?.message || JSON.stringify(error.response.data);
      setError(msg);
      return {
      exists: false
    };
    }

    console.log('API call error:', error?.message || error);
    setError('Unable to contact verification service');
    return {
      exists: false
    };
  }
};

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
          {/* <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Identity Verification</Text>
            <View style={styles.placeholderButton} />
          </View> */}
          <View style={styles.mainHeader}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.headerBackButton}
      >
        <Text style={styles.headerBackText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.txtHeaderTitle}>Identity Verification</Text>
      <View style={styles.headerRight} />
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
                placeholder="Enter Registration number"
                placeholderTextColor={colors.textGray}
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                editable={!isLoading}
              />
              {registrationNumber.length > 0 && !isLoading && (
                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {/* <Text style={styles.helperText}>
              You can find this number in your enrollment confirmation email
            </Text> */}
          </View>

          <LinearGradient
            colors={[colors.purple1, colors.purple2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanButtonGradient}
          >
            <TouchableOpacity
              style={[
                styles.scanButton,
                (!registrationNumber.trim() || isLoading) && styles.scanButtonDisabled
              ]}
              onPress={handleStartScan}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text style={styles.scanButtonIcon}>📸</Text>
                  <Text style={styles.scanButtonText}>Start Face Verification</Text>
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
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60, // Fixed height for consistent alignment
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop:10
  },
  headerBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8, // Pull the button slightly to the left
  },
  headerBackText: {
    fontSize: 32,
    color: '#000',
    lineHeight: 38, // Adjust line height to match text size
    marginTop: -2, // Fine-tune vertical alignment
  },
  txtHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Sen-SemiBold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    // marginRight: 44, // Match the width of the back button
    lineHeight: 20, // Ensure consistent line height
    paddingTop: 2, // Fine-tune vertical alignment
  },
headerRight: {
  width: 37, // Same as back button for balance
},
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
  scanButtonDisabled: {
    opacity: 0.5,
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
