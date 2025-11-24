import React, {memo} from 'react';
import {Animated, StyleSheet, Dimensions} from 'react-native';

const {height} = Dimensions.get('window');

interface AnimatedBubbleProps {
  translateYAnim: Animated.AnimatedInterpolation<number>;
  translateX: number;
  size: number;
  top: number;
  left?: number;
  right?: number;
}

const AnimatedBubble: React.FC<AnimatedBubbleProps> = memo(
  ({translateYAnim, translateX, size, top, left, right}) => {
    return (
      <Animated.View
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            top,
            left,
            right,
            transform: [{translateY: translateYAnim}, {translateX}],
          },
        ]}
      />
    );
  },
);

AnimatedBubble.displayName = 'AnimatedBubble';

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export default AnimatedBubble;
