import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';

interface SuccessRegistrationCardProps {
  registrationNumber: string;
  copied: boolean;
  opacityAnim: Animated.Value;
  slideAnim: Animated.Value;
  onCopy: () => void;
  onShare: () => void;
}

const SuccessRegistrationCard = React.memo<SuccessRegistrationCardProps>(({
  registrationNumber,
  copied,
  opacityAnim,
  slideAnim,
  onCopy,
  onShare,
}) => {
  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 10,
        borderRadius: 12,
        elevation: 6,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={[colors.borderGray, colors.white]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.registrationCard}
      >
        <View style={styles.registrationHeader}>
          <Text style={styles.iconBadge}>📋</Text>
          <Text style={styles.registrationLabel}>Registration Number</Text>
        </View>

        <Text style={styles.registrationNumber}>{registrationNumber}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={onCopy}
            style={[styles.actionButton, styles.actionButtonGrey]}
          >
            <Text style={styles.buttonIcon}>{copied ? '✓' : '📋'}</Text>
            <Text style={[styles.actionButtonText, styles.actionButtonTextGrey]}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onShare}
            style={[styles.actionButton, styles.actionButtonGrey]}
          >
            <Text style={styles.buttonIcon}>📤</Text>
            <Text style={[styles.actionButtonText, styles.actionButtonTextGrey]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

SuccessRegistrationCard.displayName = 'SuccessRegistrationCard';

const styles = StyleSheet.create({
  registrationCard: {
    padding: 16,
    width: '100%',
  },
  registrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    fontSize: 18,
    marginRight: 6,
  },
  registrationLabel: {
    fontSize: 12,
    fontFamily: 'Sen-SemiBold',
  },
  registrationNumber: {
    fontSize: 20,
    marginVertical: 10,
    letterSpacing: 1.5,
    fontFamily: 'Sen-Bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonGrey: {
    backgroundColor: colors.black20,
  },
  buttonIcon: {
    fontSize: 14,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Sen-SemiBold',
  },
  actionButtonTextGrey: {
    color: colors.darkText,
  },
});

export default SuccessRegistrationCard;
