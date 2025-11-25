import {useEffect, useRef, useMemo} from 'react';
import {Animated, Dimensions} from 'react-native';

const {height} = Dimensions.get('window');

export const useEnrollmentAnimations = () => {
  const faceScaleAnim = useRef(new Animated.Value(1)).current;
  const fingerScaleAnim = useRef(new Animated.Value(1)).current;

  const faceScanlineAnim = useRef(new Animated.Value(0)).current;
  const fingerScanlineAnim = useRef(new Animated.Value(0)).current;

  const faceFrameAnim = useRef(new Animated.Value(0)).current;
  const fingerPulseAnim = useRef(new Animated.Value(0)).current;

  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;
  const bubble4 = useRef(new Animated.Value(0)).current;
  const bubble5 = useRef(new Animated.Value(0)).current;

  const cornerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(faceScanlineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(faceScanlineAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(fingerScanlineAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(fingerScanlineAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(faceFrameAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(faceFrameAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(fingerPulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(fingerPulseAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim1, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim2, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim2, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const startBubbleAnimation = (
      bubbleAnim: Animated.Value,
      duration: number,
      delay: number,
    ) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(bubbleAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    startBubbleAnimation(bubble1, 4000, 0);
    startBubbleAnimation(bubble2, 5000, 500);
    startBubbleAnimation(bubble3, 4500, 1000);
    startBubbleAnimation(bubble4, 5500, 1500);
    startBubbleAnimation(bubble5, 4200, 2000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [
    faceScanlineAnim,
    fingerScanlineAnim,
    faceFrameAnim,
    fingerPulseAnim,
    waveAnim1,
    waveAnim2,
    bubble1,
    bubble2,
    bubble3,
    bubble4,
    bubble5,
    cornerAnim,
  ]);

  const interpolations = useMemo(
    () => ({
      faceScanlineTranslateY: faceScanlineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-80, 80],
      }),
      fingerScanlineTranslateY: fingerScanlineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-60, 60],
      }),
      faceFrameOpacity: faceFrameAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.9],
      }),
      fingerPulseScale: fingerPulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1.1],
      }),
      cornerOpacity: cornerAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.4, 1, 0.4],
      }),
      waveScale1: waveAnim1.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1.5],
      }),
      waveOpacity1: waveAnim1.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      waveScale2: waveAnim2.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1.5],
      }),
      waveOpacity2: waveAnim2.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      bubble1Transform: bubble1.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -height * 0.5],
      }),
      bubble2Transform: bubble2.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -height * 0.6],
      }),
      bubble3Transform: bubble3.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -height * 0.55],
      }),
      bubble4Transform: bubble4.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -height * 0.65],
      }),
      bubble5Transform: bubble5.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -height * 0.5],
      }),
    }),
    [
      faceScanlineAnim,
      fingerScanlineAnim,
      faceFrameAnim,
      fingerPulseAnim,
      cornerAnim,
      waveAnim1,
      waveAnim2,
      bubble1,
      bubble2,
      bubble3,
      bubble4,
      bubble5,
    ],
  );

  return {
    faceScaleAnim,
    fingerScaleAnim,
    ...interpolations,
  };
};
