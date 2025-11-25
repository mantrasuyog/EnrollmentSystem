import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../common/colors';

interface FaceFrameOverlayProps {
  headerAnim: Animated.Value;
  pulseAnim: Animated.Value;
  frameAnim: Animated.Value;
  cornerRotateAnim: Animated.Value;
  isValidFace: boolean;
}

const FaceFrameOverlay = React.memo<FaceFrameOverlayProps>(({
  headerAnim,
  pulseAnim,
  frameAnim,
  cornerRotateAnim,
  isValidFace,
}) => {
  const cornerRotate = cornerRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }],
          },
        ]}
      >
        <Text style={styles.title}>Face Enrollment</Text>
        <Text style={styles.subtitle}>Position your face in the frame</Text>
      </Animated.View>

      <View style={styles.faceFrameContainer}>
        <Animated.View
          style={[
            styles.faceFrame,
            {
              borderColor: isValidFace ? colors.green1 : colors.primaryBlue,
              transform: [
                { scale: pulseAnim },
                { scale: frameAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }
              ],
              opacity: frameAnim,
            },
          ]}
        >
          <Animated.View style={[styles.corner, styles.topLeft, { transform: [{ rotate: cornerRotate }] }]} />
          <Animated.View style={[styles.corner, styles.topRight, { transform: [{ rotate: cornerRotate }] }]} />
          <Animated.View style={[styles.corner, styles.bottomLeft, { transform: [{ rotate: cornerRotate }] }]} />
          <Animated.View style={[styles.corner, styles.bottomRight, { transform: [{ rotate: cornerRotate }] }]} />
        </Animated.View>
      </View>
    </View>
  );
});

FaceFrameOverlay.displayName = 'FaceFrameOverlay';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.overlayBlack60,
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Sen-Bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Sen-Regular',
    color: colors.placeholderGray,
  },
  faceFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  faceFrame: {
    width: 300,
    height: 380,
    borderWidth: 3,
    borderRadius: 150,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderColor: colors.white,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 12,
  },
});

export default FaceFrameOverlay;
