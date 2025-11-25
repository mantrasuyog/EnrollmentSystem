import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../common/colors';

interface SuccessEnrollmentDetailsCardProps {
  enrollmentDate: string;
  centerCode: string;
  opacityAnim: Animated.Value;
  slideAnim: Animated.Value;
}

const SuccessEnrollmentDetailsCard = React.memo<SuccessEnrollmentDetailsCardProps>(({
  enrollmentDate,
  centerCode,
  opacityAnim,
  slideAnim,
}) => {
  return (
    <Animated.View
      style={[
        styles.enrollmentDetailsCard,
        { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.detailsRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailLabel}>Enrollment Date</Text>
          <Text style={styles.detailValue}>{enrollmentDate}</Text>
        </View>

        <View style={styles.divider} />

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={styles.detailLabel}>Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <View style={styles.dividerother} />

        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={styles.detailLabel}>Center Code</Text>
          <Text style={styles.detailValue}>{centerCode}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

SuccessEnrollmentDetailsCard.displayName = 'SuccessEnrollmentDetailsCard';

const styles = StyleSheet.create({
  enrollmentDetailsCard: {
    backgroundColor: colors.grayLight2,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGray,
    marginBottom: 14,
  },
  detailsRow: {
    flexDirection: 'row',
  },
  detailLabel: {
    fontSize: 11,
    color: colors.placeholderGray,
    fontFamily: 'Sen-Regular',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Sen-SemiBold',
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderGray,
    marginLeft: 12,
  },
  dividerother: {
    width: 1,
    backgroundColor: colors.borderGray,
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green1,
  },
  statusText: {
    fontSize: 13,
    color: colors.green1,
    fontFamily: 'Sen-SemiBold',
    marginLeft: 5,
  },
});

export default SuccessEnrollmentDetailsCard;
