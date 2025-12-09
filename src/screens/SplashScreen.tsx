import React, { useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from './HomeScreen';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'SplashScreen'>;

interface SplashScreenProps extends Props {
  duration?: number;
}

interface ParticleProps {
  index: number;
  opacityAnim: Animated.Value;
}

const Particle = memo<ParticleProps>(({ index, opacityAnim }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000 + index * 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000 + index * 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, index]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30 - index * 10],
  });

  const particleOpacity = opacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4 - index * 0.05],
  });

  const left = (index * 60) % (width - 40);
  const top = (index * 80) % (height - 100);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left,
          top,
          opacity: particleOpacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
});

interface RippleProps {
  delay: number;
}

const Ripple = memo<RippleProps>(({ delay }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim, opacityAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
});

const SplashScreen: React.FC<SplashScreenProps> = ({
  navigation,
  duration = 4000,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const textTranslateAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const navigateToHome = useCallback(() => {
    navigation.replace('Home');
  }, [navigation]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(textOpacityAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration - 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      navigateToHome();
    }, duration);

    return () => clearTimeout(timer);
  }, [
    scaleAnim,
    opacityAnim,
    rotateAnim,
    textOpacityAnim,
    textTranslateAnim,
    pulseAnim,
    progressAnim,
    glowAnim,
    duration,
    navigateToHome,
  ]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      <LinearGradient
        colors={[colors.splash1, colors.splash2, colors.splash3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {[...Array(8)].map((_, i) => (
          <Particle key={i} index={i} opacityAnim={opacityAnim} />
        ))}

        <View style={styles.contentContainer}>
          <View style={styles.iconWrapper}>
            <Ripple delay={0} />
            <Ripple delay={500} />
            <Ripple delay={1000} />

            <Animated.View
              style={[
                styles.rotatingRing,
                {
                  transform: [{ rotate: rotateInterpolate }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <LinearGradient
                colors={[colors.purple1, colors.purple2, colors.pink1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ringGradient}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.glowCircle,
                {
                  opacity: glowOpacity,
                  transform: [{ scale: glowScale }],
                },
              ]}
            />

            <Animated.View
              style={[
                styles.mainIcon,
                {
                  transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <LinearGradient
                colors={[colors.purple1, colors.purple2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Text style={styles.iconEmoji}>🔐</Text>
              </LinearGradient>
            </Animated.View>

            <View style={[styles.cornerAccent, styles.topLeftCorner]} />
            <View style={[styles.cornerAccent, styles.topRightCorner]} />
            <View style={[styles.cornerAccent, styles.bottomLeftCorner]} />
            <View style={[styles.cornerAccent, styles.bottomRightCorner]} />
          </View>

          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacityAnim,
                transform: [{ translateY: textTranslateAnim }],
              },
            ]}
          >
            <Text style={styles.mainTitle}>Biometric System</Text>
            <Text style={styles.subtitle}>Advanced Security Enrollment</Text>
            <View style={styles.featureContainer}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Facial Recognition</Text>
            </View>
            <View style={styles.featureContainer}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Document Scanning</Text>
            </View>
            <View style={styles.featureContainer}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Secure Authentication</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.progressContainer,
              {
                opacity: textOpacityAnim,
              },
            ]}
          >
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={[colors.purple1, colors.purple2, colors.pink1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
            <Text style={styles.loadingText}>Loading Secure Components...</Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.brandingContainer,
            {
              opacity: textOpacityAnim,
            },
          ]}>
          <Text style={styles.brandingText}>Powered by Mantra Smart Identity</Text>
          <Text style={styles.versionText}>v1.0.0</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.splash1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.purple1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconWrapper: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  ripple: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: colors.purple1,
  },
  rotatingRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
  },
  ringGradient: {
    flex: 1,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  glowCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.purple1,
    shadowColor: colors.purple1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  mainIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: colors.purple2,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 70,
  },
  cornerAccent: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.purple1,
    borderWidth: 3,
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontFamily: 'Sen-Bold',
    color: colors.white,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
    color: colors.white80,
    marginBottom: 30,
    textAlign: 'center',
  },
  featureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.purple1,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.white70,
  },
  progressContainer: {
    width: width - 80,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.white15,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressGradient: {
    flex: 1,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.white60,
  },
  brandingContainer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.white50,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    fontFamily: 'Sen-Regular',
    color: colors.white30,
  },
});

export default SplashScreen;
