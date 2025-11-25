import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../common/colors';

interface SuccessCheckmarkProps {
  scaleAnim: Animated.Value;
  bounceAnim: Animated.Value;
  blinkAnim: Animated.Value;
  pulseAnim: Animated.Value;
}

const SuccessCheckmark = React.memo<SuccessCheckmarkProps>(({
  scaleAnim,
  bounceAnim,
  blinkAnim,
  pulseAnim,
}) => {
  return (
    <Animated.View
      style={[
        styles.checkmarkContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Animated.View
        style={[
          styles.checkmarkCircle,
          {
            transform: [
              {
                scale: bounceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.checkmarkText,
            { opacity: blinkAnim, transform: [{ scale: pulseAnim }] },
          ]}
        >
          ✓
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
});

SuccessCheckmark.displayName = 'SuccessCheckmark';

const styles = StyleSheet.create({
  checkmarkContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmarkCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.green1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 40,
    color: colors.white,
    fontFamily: 'Sen-Bold',
  },
});

export default SuccessCheckmark;
