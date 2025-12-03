import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { colors } from '../common/colors';

const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const scale = screenWidth / 375;

interface HeroSectionProps {
  fadeAnim: Animated.Value;
  pulseAnim: Animated.Value;
  isDarkMode: boolean;
}

const HeroSection = React.memo<HeroSectionProps>(({ fadeAnim, pulseAnim, isDarkMode }) => {
  // Animation values for 3 circular ripples
  const ripple1Anim = useRef(new Animated.Value(0)).current;
  const ripple2Anim = useRef(new Animated.Value(0)).current;
  const ripple3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createRippleAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createRippleAnimation(ripple1Anim, 0);
    const anim2 = createRippleAnimation(ripple2Anim, 666);
    const anim3 = createRippleAnimation(ripple3Anim, 1333);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [ripple1Anim, ripple2Anim, ripple3Anim]);

  const createRippleStyle = (animValue: Animated.Value) => ({
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1.2, 2.5],
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    }),
  });

  return (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <View style={styles.heroSection}>
        <Animated.View style={[styles.fingerprintContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.fingerprintIcon}>👆</Text>
          <Animated.View style={[styles.rippleCircle, createRippleStyle(ripple1Anim)]} />
          <Animated.View style={[styles.rippleCircle, createRippleStyle(ripple2Anim)]} />
          <Animated.View style={[styles.rippleCircle, createRippleStyle(ripple3Anim)]} />
        </Animated.View>
        <Text style={[styles.title, isDarkMode && styles.textDark]}>
          Biometric Security
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Advanced authentication using your unique biometric patterns
        </Text>
      </View>
    </Animated.View>
  );
});

HeroSection.displayName = 'HeroSection';

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingBottom: Math.min(15, screenWidth * 0.03),
  },
  heroSection: {
    alignItems: 'center',
  },
  fingerprintContainer: {
    position: 'relative',
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  fingerprintIcon: {
    fontSize: 50,
    zIndex: 10,
  },
  rippleCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  title: {
    fontSize: Math.min(26, screenWidth * 0.055),
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
    marginBottom: Math.min(6, screenWidth * 0.012),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.min(13, screenWidth * 0.032),
    color: colors.midGray,
    textAlign: 'center',
    fontFamily: 'Sen-Regular',
    lineHeight: Math.min(18, screenWidth * 0.04),
    paddingHorizontal: Math.min(10, screenWidth * 0.025),
  },
  subtitleDark: {
    color: colors.placeholderGray,
    fontFamily: 'Sen-SemiBold',
  },
  textDark: {
    color: colors.white,
    fontFamily: 'Sen-SemiBold',
  },
});

export default HeroSection;
