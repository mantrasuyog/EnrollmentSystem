import React, {memo, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  onStepPress: (step: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = memo(
  ({steps, currentStep, onStepPress}) => {
    const scaleAnims = useRef(
      steps.map(() => new Animated.Value(1)),
    ).current;
    const pulseAnims = useRef(
      steps.map(() => new Animated.Value(0)),
    ).current;

    useEffect(() => {

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnims[currentStep - 1], {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnims[currentStep - 1], {
            toValue: 0,
            duration: 1200,
            useNativeDriver: false,
          }),
        ]),
      );
      pulseAnimation.start();

      Animated.spring(scaleAnims[currentStep - 1], {
        toValue: 1.15,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      scaleAnims.forEach((anim, index) => {
        if (index !== currentStep - 1) {
          Animated.spring(anim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      });

      return () => {
        pulseAnimation.stop();
      };
    }, [currentStep, scaleAnims, pulseAnims]);

    return (
      <View style={styles.stepContainer}>
        {steps.map((step, index) => {
          const isActive = index + 1 === currentStep;
          const isCompleted = index + 1 < currentStep;

          const pulsateSize = pulseAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 18],
          });

          return (
            <View key={index} style={styles.stepWrapper}>
              {isActive && (
                <Animated.View
                  style={[
                    styles.glowRing,
                    {
                      width: Animated.add(56, pulsateSize),
                      height: Animated.add(56, pulsateSize),
                    },
                  ]}
                />
              )}

              {isActive && (
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      width: Animated.add(40, pulsateSize),
                      height: Animated.add(40, pulsateSize),
                    },
                  ]}
                />
              )}

              <TouchableOpacity
                onPress={() => onStepPress(index + 1)}
                activeOpacity={0.8}
                style={[
                  styles.stepCircle,
                  isActive && styles.activeStepShadow,
                  isCompleted && styles.completedStepShadow,
                ]}>
                <Animated.View
                  style={{
                    transform: [{scale: scaleAnims[index]}],
                  }}>
                  <LinearGradient
                    colors={
                      isCompleted
                        ? ['#4CAF50', '#45a049']
                        : isActive
                        ? ['#667eea', '#764ba2']
                        : ['#ffffff', '#f8f9ff']
                    }
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.gradientCircle}>
                    <Text
                      style={[
                        styles.stepNumber,
                        (isActive || isCompleted) && styles.stepNumberActive,
                      ]}>
                      {isCompleted ? '✓' : index + 1}
                    </Text>
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>

              <Text
                style={[
                  styles.stepLabel,
                  (isActive || isCompleted) && styles.stepLabelActive,
                ]}>
                {step}
              </Text>

              {index < steps.length - 1 && (
                <LinearGradient
                  colors={
                    isCompleted
                      ? ['#4CAF50', '#45a049']
                      : ['#e0e0e0', '#f0f0f0']
                  }
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.connector}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  },
  (prev, next) =>
    prev.currentStep === next.currentStep &&
    JSON.stringify(prev.steps) === JSON.stringify(next.steps),
);

StepIndicator.displayName = 'StepIndicator';

const styles = StyleSheet.create({
  stepContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#667eea',
    opacity: 0.35,
    top: -3,
    left: -3,
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 28,
    backgroundColor: '#667eea',
    opacity: 0.08,
    top: -8,
    left: -8,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  activeStepShadow: {
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  completedStepShadow: {
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  gradientCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
    fontFamily: 'Sen-Bold',
  },
  stepLabel: {
    fontSize: 9.5,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Sen-SemiBold',
    marginTop: 4,
  },
  stepLabelActive: {
    color: '#667eea',
    fontFamily: 'Sen-SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  connector: {
    position: 'absolute',
    top: 20,
    left: '50%',
    width: '100%',
    height: 2,
    zIndex: -1,
    borderRadius: 1,
  },
});

export default StepIndicator;
