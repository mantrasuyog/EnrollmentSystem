import {useRef, useEffect} from 'react';
import {Animated, Dimensions} from 'react-native';

const {height} = Dimensions.get('window');

export const useAnimations = () => {
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const buttonPressAnim = useRef(new Animated.Value(1)).current;
  const loaderScaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const welcomeScaleAnim = useRef(new Animated.Value(0.9)).current;
  const submitButtonAnim = useRef(new Animated.Value(1)).current;

  const errorSlideAnim = useRef(new Animated.Value(height)).current;
  const errorFadeAnim = useRef(new Animated.Value(0)).current;
  const errorBlurOpacity = useRef(new Animated.Value(0)).current;
  const errorScaleAnim = useRef(new Animated.Value(0.8)).current;

  const centreCodeSlideAnim = useRef(new Animated.Value(height)).current;
  const centreCodeFadeAnim = useRef(new Animated.Value(0)).current;
  const centreCodeBlurOpacity = useRef(new Animated.Value(0)).current;
  const centreCodeScaleAnim = useRef(new Animated.Value(0.8)).current;

  const actionModalSlideAnim = useRef(new Animated.Value(height)).current;
  const actionModalFadeAnim = useRef(new Animated.Value(0)).current;
  const actionModalBlurOpacity = useRef(new Animated.Value(0)).current;

  const deleteConfirmSlideAnim = useRef(new Animated.Value(height)).current;
  const deleteConfirmFadeAnim = useRef(new Animated.Value(0)).current;
  const deleteConfirmBlurOpacity = useRef(new Animated.Value(0)).current;

  const documentZoomSlideAnim = useRef(new Animated.Value(height)).current;
  const documentZoomFadeAnim = useRef(new Animated.Value(0)).current;
  const documentZoomBlurOpacity = useRef(new Animated.Value(0)).current;

  const bubble1Anim = useRef(new Animated.Value(0)).current;
  const bubble2Anim = useRef(new Animated.Value(0)).current;
  const bubble3Anim = useRef(new Animated.Value(0)).current;

  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const loaderAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const floatAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const rotateAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const bubble1AnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const bubble2AnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const bubble3AnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    startPulseAnimation();
    startFloatAnimation();
    startRotateAnimation();
    startWelcomeAnimation();

    return () => {
      
      pulseAnimationRef.current?.stop();
      loaderAnimationRef.current?.stop();
      floatAnimationRef.current?.stop();
      rotateAnimationRef.current?.stop();
      bubble1AnimRef.current?.stop();
      bubble2AnimRef.current?.stop();
      bubble3AnimRef.current?.stop();
    };
  }, []);

  const startWelcomeAnimation = () => {
    Animated.timing(welcomeScaleAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const startFloatAnimation = () => {
    const floatSequence = Animated.sequence([
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(floatAnim, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: true,
      }),
    ]);

    floatAnimationRef.current = Animated.loop(floatSequence);
    floatAnimationRef.current.start();
  };

  const startRotateAnimation = () => {
    const rotateSequence = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
    );

    rotateAnimationRef.current = rotateSequence;
    rotateAnimationRef.current.start();
  };

  const startPulseAnimation = () => {
    const pulseSequence = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]);

    pulseAnimationRef.current = Animated.loop(pulseSequence);
    pulseAnimationRef.current.start();
  };

  const startLoaderAnimation = () => {
    const loaderSequence = Animated.sequence([
      Animated.timing(loaderScaleAnim, {
        toValue: 1.2,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(loaderScaleAnim, {
        toValue: 0.8,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    loaderAnimationRef.current = Animated.loop(loaderSequence);
    loaderAnimationRef.current.start();
  };

  const stopLoaderAnimation = () => {
    loaderAnimationRef.current?.stop();
    loaderScaleAnim.setValue(1);
  };

  const startBubbleAnimations = () => {
    const bubble1Sequence = Animated.sequence([
      Animated.timing(bubble1Anim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }),
      Animated.timing(bubble1Anim, {
        toValue: 0,
        duration: 4000,
        useNativeDriver: true,
      }),
    ]);
    bubble1AnimRef.current = Animated.loop(bubble1Sequence);
    bubble1AnimRef.current.start();

    const bubble2Sequence = Animated.sequence([
      Animated.timing(bubble2Anim, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: true,
      }),
      Animated.timing(bubble2Anim, {
        toValue: 0,
        duration: 3500,
        useNativeDriver: true,
      }),
    ]);
    bubble2AnimRef.current = Animated.loop(bubble2Sequence);
    bubble2AnimRef.current.start();

    const bubble3Sequence = Animated.sequence([
      Animated.timing(bubble3Anim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(bubble3Anim, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: true,
      }),
    ]);
    bubble3AnimRef.current = Animated.loop(bubble3Sequence);
    bubble3AnimRef.current.start();
  };

  const stopBubbleAnimations = () => {
    bubble1AnimRef.current?.stop();
    bubble2AnimRef.current?.stop();
    bubble3AnimRef.current?.stop();
  };

  return {
    
    slideAnim,
    fadeAnim,
    blurOpacity,
    scaleAnim,
    pulseAnim,
    buttonPressAnim,
    loaderScaleAnim,
    floatAnim,
    rotateAnim,
    welcomeScaleAnim,
    submitButtonAnim,
    errorSlideAnim,
    errorFadeAnim,
    errorBlurOpacity,
    errorScaleAnim,
    centreCodeSlideAnim,
    centreCodeFadeAnim,
    centreCodeBlurOpacity,
    centreCodeScaleAnim,
    actionModalSlideAnim,
    actionModalFadeAnim,
    actionModalBlurOpacity,
    deleteConfirmSlideAnim,
    deleteConfirmFadeAnim,
    deleteConfirmBlurOpacity,
    documentZoomSlideAnim,
    documentZoomFadeAnim,
    documentZoomBlurOpacity,
    bubble1Anim,
    bubble2Anim,
    bubble3Anim,
    
    startLoaderAnimation,
    stopLoaderAnimation,
    startBubbleAnimations,
    stopBubbleAnimations,
  };
};
