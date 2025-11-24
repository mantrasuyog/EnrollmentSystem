import React, {memo, useEffect, useRef} from 'react';
import {Animated} from 'react-native';

interface AnimatedScreenProps {
  children: React.ReactNode;
}

const AnimatedScreen: React.FC<AnimatedScreenProps> = memo(({children}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{translateY: slideAnim}],
      }}>
      {children}
    </Animated.View>
  );
});

AnimatedScreen.displayName = 'AnimatedScreen';

export default AnimatedScreen;
