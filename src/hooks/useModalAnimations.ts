import {useCallback} from 'react';
import {Animated, Dimensions} from 'react-native';

const {height} = Dimensions.get('window');

interface ModalAnimations {
  slideAnim: Animated.Value;
  fadeAnim: Animated.Value;
  blurOpacity: Animated.Value;
  scaleAnim: Animated.Value;
}

export const useModalAnimations = (
  animations: ModalAnimations,
  onClose?: () => void,
) => {
  const triggerModalAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(animations.slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(animations.fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(animations.blurOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(animations.scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animations]);

  const closeModalAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(animations.slideAnim, {
        toValue: height,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animations.fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animations.blurOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(animations.scaleAnim, {
        toValue: 0.8,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  }, [animations, onClose]);

  return {
    triggerModalAnimation,
    closeModalAnimation,
  };
};
