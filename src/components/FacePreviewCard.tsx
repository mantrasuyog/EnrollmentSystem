import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface FacePreviewCardProps {
  capturedImage: string;
  slideAnim: Animated.Value;
  checkmarkAnim: Animated.Value;
  onRetake: () => void;
  onEnroll: () => void;
}

const FacePreviewCard = React.memo<FacePreviewCardProps>(({
  capturedImage,
  slideAnim,
  checkmarkAnim,
  onRetake,
  onEnroll,
}) => {
  return (
    <Animated.View
      style={[
        styles.previewContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.successIcon,
          {
            opacity: checkmarkAnim,
            transform: [{ scale: checkmarkAnim }],
          },
        ]}
      >
        <Text style={styles.checkmark}>✓</Text>
      </Animated.View>

      <Text style={styles.successTitle}>Face Captured Successfully!</Text>
      <Text style={styles.successSubtitle}>Review your photo below</Text>

      <View style={styles.imagePreviewCard}>
        <Image
          source={{ uri: capturedImage }}
          style={styles.previewImage}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={onRetake}
        >
          <Text style={styles.retakeButtonText}>↺ Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.enrollButton}
          onPress={onEnroll}
        >
          <Text style={styles.enrollButtonText}>Enroll Face</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

FacePreviewCard.displayName = 'FacePreviewCard';

const styles = StyleSheet.create({
  previewContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    color: '#fff',
    fontSize: 40,
    fontFamily: 'Sen-Bold',
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: '#212121',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: 'Sen-Regular',
    color: '#757575',
    marginBottom: 20,
  },
  imagePreviewCard: {
    width: width - 80,
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  retakeButtonText: {
    color: '#424242',
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
  },
  enrollButton: {
    flex: 2,
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Sen-Bold',
  },
});

export default FacePreviewCard;
