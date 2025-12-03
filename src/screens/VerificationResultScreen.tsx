import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';

type RootStackParamList = {
  VerificationScreen: undefined;
  Home: undefined;
  VerificationResult: {
    registrationNumber: string;
    responseData: any;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'VerificationResult'>;

const VerificationResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { registrationNumber, responseData } = route.params;

  const isSuccess =
    responseData?.result === 'VERIFIED' ||
    responseData?.verification_details?.face_match?.matched === true;

  const message = responseData?.message || '';
  const score = responseData?.match_score || '--';
  const dateTime = new Date().toLocaleString();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.bgLight} barStyle="dark-content" />
      <View style={styles.container}>
        {isSuccess ? (
          // ---------------- SUCCESS UI ----------------
          <View style={styles.successContainer}>
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
            </View>

            <Text style={styles.successTitle}>Verification Successful</Text>
            <Text style={styles.successMessage}>{message}</Text>

            <View style={styles.resultCard}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Registration Number</Text>
                <Text style={styles.resultValue}>{registrationNumber}</Text>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Match Score</Text>
                <Text style={styles.resultValue}>{score}</Text>
              </View>

              <View style={styles.resultDivider} />

              {/* ⭐ DATE & TIME ADDED HERE */}
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Date & Time</Text>
                <Text style={styles.resultValue}>{dateTime}</Text>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Status</Text>
                <Text style={styles.resultStatus}>{responseData?.result || 'Verified'}</Text>
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
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.actionButtonText}>Return to Home</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          // ---------------- FAILURE UI ----------------
          <View style={styles.failureContainer}>
            <View style={styles.failureIconContainer}>
              <Text style={styles.failureIcon}>✕</Text>
            </View>

            <Text style={styles.failureTitle}>Verification Failed</Text>
            <Text style={styles.failureMessage}>{message}</Text>

            <View style={styles.resultCard}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Registration Number</Text>
                <Text style={styles.resultValue}>{registrationNumber}</Text>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Match Score</Text>
                <Text style={styles.resultValue}>{score}</Text>
              </View>

              <View style={styles.resultDivider} />

              {/* ⭐ DATE & TIME ADDED HERE */}
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Date & Time</Text>
                <Text style={styles.resultValue}>{dateTime}</Text>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Status</Text>
                <Text style={[styles.resultValue, { color: '#FF6B6B' }]}>
                  {responseData?.result || 'Not Verified'}
                </Text>
              </View>
            </View>

            {/* POSSIBLE REASONS */}
            {/* <View style={styles.failureReasons}>
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
                <Text style={styles.reasonText}>
                  Registration number mismatch
                </Text>
              </View>
            </View> */}

            <LinearGradient
              colors={[colors.purple1, colors.purple2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('VerificationScreen')}
              >
                <Text style={styles.actionButtonText}>Try Again</Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.secondaryButtonText}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        )}
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

  // SUCCESS -------------------------
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
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Sen-Bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    marginBottom: 20,
    textAlign: 'center',
  },

  // FAILURE -------------------------
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
  },
  failureTitle: {
    fontSize: 24,
    fontFamily: 'Sen-Bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  failureMessage: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    marginBottom: 20,
    textAlign: 'center',
  },

  // RESULT CARD -------------------------
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

  // REASONS BLOCK -------------------------
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
  },
  reasonText: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.textGray,
    flex: 1,
  },

  // BUTTONS -------------------------
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
