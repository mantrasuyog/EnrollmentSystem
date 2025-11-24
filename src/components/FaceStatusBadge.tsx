import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface FaceStatusBadgeProps {
  validationStatus: string;
  isValidFace: boolean;
  isFaceDetected: boolean;
  statusBounceAnim: Animated.Value;
}

const FaceStatusBadge = React.memo<FaceStatusBadgeProps>(({
  validationStatus,
  isValidFace,
  isFaceDetected,
  statusBounceAnim,
}) => {
  const backgroundColor = isValidFace
    ? 'rgba(76, 175, 80, 0.9)'
    : isFaceDetected
      ? 'rgba(255, 165, 0, 0.9)'
      : 'rgba(244, 67, 54, 0.9)';

  return (
    <View style={styles.statusContainerTop}>
      <Animated.View
        style={[
          styles.statusBadge,
          {
            backgroundColor,
            transform: [{ scale: statusBounceAnim }],
          },
        ]}
      >
        <Text style={styles.statusText}>
          {validationStatus || 'Scanning...'}
        </Text>
      </Animated.View>
    </View>
  );
});

FaceStatusBadge.displayName = 'FaceStatusBadge';

const styles = StyleSheet.create({
  statusContainerTop: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
  },
});

export default FaceStatusBadge;
