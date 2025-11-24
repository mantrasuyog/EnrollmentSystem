import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Face } from '@react-native-ml-kit/face-detection';

interface CheckItemProps {
  label: string;
  checked: boolean;
}

const CheckItem = React.memo<CheckItemProps>(({ label, checked }) => (
  <View style={styles.checkItem}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkboxIcon}>✓</Text>}
    </View>
    <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]}>
      {label}
    </Text>
  </View>
));

CheckItem.displayName = 'CheckItem';

interface FaceCheckListProps {
  detectedFace: Face;
  checklistAnim: Animated.Value;
}

const FaceCheckList = React.memo<FaceCheckListProps>(({ detectedFace, checklistAnim }) => {
  const eyesOpen = useMemo(() => {
    return (
      (detectedFace.leftEyeOpenProbability || 0) > 0.5 &&
      (detectedFace.rightEyeOpenProbability || 0) > 0.5
    );
  }, [detectedFace.leftEyeOpenProbability, detectedFace.rightEyeOpenProbability]);

  const isCentered = useMemo(() => {
    const faceCenterX = detectedFace.frame.left + detectedFace.frame.width / 2;
    const faceCenterY = detectedFace.frame.top + detectedFace.frame.height / 2;
    const imageWidth = 640;
    const imageHeight = 480;
    const CENTER_TOLERANCE_PERCENT = 0.025;
    const isInHorizontalCenter =
      faceCenterX > imageWidth * CENTER_TOLERANCE_PERCENT &&
      faceCenterX < imageWidth * (1 - CENTER_TOLERANCE_PERCENT);
    const isInVerticalCenter =
      faceCenterY > imageHeight * CENTER_TOLERANCE_PERCENT &&
      faceCenterY < imageHeight * (1 - CENTER_TOLERANCE_PERCENT);
    return isInHorizontalCenter && isInVerticalCenter;
  }, [detectedFace.frame]);

  const headStraight = useMemo(() => {
    return (
      Math.abs(detectedFace.rotationY) < 30 &&
      Math.abs(detectedFace.rotationZ) < 30
    );
  }, [detectedFace.rotationY, detectedFace.rotationZ]);

  const clearFace = useMemo(() => {
    return (
      detectedFace.frame.width > 60 &&
      detectedFace.frame.height > 60
    );
  }, [detectedFace.frame.width, detectedFace.frame.height]);

  return (
    <Animated.View
      style={[
        styles.checklistContainerBottomLeft,
        {
          opacity: checklistAnim,
          transform: [
            { translateX: checklistAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }
          ],
        },
      ]}
    >
      <CheckItem label="Eyes open" checked={eyesOpen} />
      <CheckItem label="Centered" checked={isCentered} />
      <CheckItem label="Head straight" checked={headStraight} />
      <CheckItem label="Clear face" checked={clearFace} />
    </Animated.View>
  );
});

FaceCheckList.displayName = 'FaceCheckList';

const styles = StyleSheet.create({
  checklistContainerBottomLeft: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 15,
    padding: 15,
    maxWidth: 200,
    zIndex: 3,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#757575',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxIcon: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Sen-Bold',
  },
  checkLabel: {
    color: '#9E9E9E',
    fontSize: 14,
    fontFamily: 'Sen-Regular',
  },
  checkLabelChecked: {
    color: '#fff',
    fontFamily: 'Sen-SemiBold',
  },
});

export default FaceCheckList;
