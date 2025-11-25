import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
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
  return (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <View style={styles.heroSection}>
        <Animated.View style={[styles.fingerprintContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.fingerprintIcon}>👆</Text>
          <View style={styles.ripple1} />
          <View style={styles.ripple2} />
          <View style={styles.ripple3} />
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
  ripple1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white30,
  },
  ripple2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white15,
  },
  ripple3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white08,
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
