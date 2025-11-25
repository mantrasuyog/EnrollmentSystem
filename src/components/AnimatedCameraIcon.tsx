import React, {useEffect, useRef} from 'react';
import {Animated, Easing} from 'react-native';
import Svg, {Path, Circle, Rect} from 'react-native-svg';

interface AnimatedCameraIconProps {
  size?: number;
  color?: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const AnimatedCameraIcon: React.FC<AnimatedCameraIconProps> = ({
  size = 28,
  color = '#FFFFFF',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const lensRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
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
      ]),
    );

    const flashAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ]),
    );

    const lensRotation = Animated.loop(
      Animated.timing(lensRotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseAnimation.start();
    flashAnimation.start();
    lensRotation.start();

    return () => {
      pulseAnimation.stop();
      flashAnimation.stop();
      lensRotation.stop();
    };
  }, []);

  const flashOpacity = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  return (
    <Animated.View style={{transform: [{scale: pulseAnim}]}}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedPath
          d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        <AnimatedCircle
          cx="12"
          cy="13"
          r="4"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />

        <AnimatedCircle
          cx="12"
          cy="13"
          r="2.5"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          opacity={0.6}
        />

        <AnimatedPath
          d="M12 10.5L13.5 13L12 15.5L10.5 13Z"
          stroke={color}
          strokeWidth="0.8"
          fill="none"
          opacity={0.5}
        />

        <AnimatedCircle
          cx="18.5"
          cy="8.5"
          r="1.2"
          fill={color}
          opacity={flashOpacity}
        />

        <AnimatedRect
          x="17.5"
          y="7.5"
          width="2"
          height="2"
          rx="0.5"
          stroke={color}
          strokeWidth="1"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
};

export default AnimatedCameraIcon;
