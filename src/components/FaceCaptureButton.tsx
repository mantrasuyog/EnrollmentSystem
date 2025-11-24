import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface FaceCaptureButtonProps {
  onPress: () => void;
  isProcessing: boolean;
  captureButtonAnim: Animated.Value;
  showCaptureButton: boolean;
}

const FaceCaptureButton = React.memo<FaceCaptureButtonProps>(({
  onPress,
  isProcessing,
  captureButtonAnim,
  showCaptureButton,
}) => {
  return (
    <Animated.View
      style={[
        styles.captureButtonContainer,
        {
          opacity: captureButtonAnim,
          transform: [
            { scale: captureButtonAnim },
            { translateY: captureButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
          ],
        },
      ]}
      pointerEvents={showCaptureButton ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={styles.captureButton}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={isProcessing}
      >
        <View style={styles.captureButtonInner}>
          <View style={styles.captureButtonRing} />
        </View>
        <Text style={styles.captureButtonText}>
          {isProcessing ? 'Capturing...' : 'Tap to Capture'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

FaceCaptureButton.displayName = 'FaceCaptureButton';

const styles = StyleSheet.create({
  captureButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  captureButtonRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4A90E2',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureButtonText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

export default FaceCaptureButton;
