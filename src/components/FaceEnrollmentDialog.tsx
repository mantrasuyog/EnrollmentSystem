import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';

const { width } = Dimensions.get('window');

interface FaceEnrollmentDialogProps {
  showEnrollDialog: boolean;
  dialogScaleAnim: Animated.Value;
  dialogOpacityAnim: Animated.Value;
  successPulseAnim: Animated.Value;
  onOk: () => void;
}

const FaceEnrollmentDialog = React.memo<FaceEnrollmentDialogProps>(({
  showEnrollDialog,
  dialogScaleAnim,
  dialogOpacityAnim,
  successPulseAnim,
  onOk,
}) => {
  if (!showEnrollDialog) return null;

  return (
    <Animated.View
      style={[
        styles.dialogOverlay,
        {
          opacity: dialogOpacityAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.dialogContainer,
          {
            transform: [{ scale: dialogScaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.dialogSuccessIcon,
            {
              transform: [{ scale: successPulseAnim }],
            },
          ]}
        >
          <Text style={styles.dialogCheckmark}>✓</Text>
        </Animated.View>

        <Text style={styles.dialogTitle}>Enrollment Successful!</Text>
        <Text style={styles.dialogMessage}>
          Your face has been successfully enrolled in the system.
        </Text>

        <View style={styles.dialogDivider} />

        <TouchableOpacity
          style={styles.dialogButton}
          onPress={onOk}
          activeOpacity={0.8}
        >
          <Text style={styles.dialogButtonText}>OK</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

FaceEnrollmentDialog.displayName = 'FaceEnrollmentDialog';

interface FaceReplaceDialogProps {
  showReplaceDialog: boolean;
  dialogScaleAnim: Animated.Value;
  dialogOpacityAnim: Animated.Value;
  existingEnrolledImage?: string | null;
  onUseExisting: () => void;
  onReplace: () => void;
}

export const FaceReplaceDialog = React.memo<FaceReplaceDialogProps>(({
  showReplaceDialog,
  dialogScaleAnim,
  dialogOpacityAnim,
  existingEnrolledImage,
  onUseExisting,
  onReplace,
}) => {
  if (!showReplaceDialog) return null;

  return (
    <Animated.View
      style={[
        styles.dialogOverlay,
        {
          opacity: dialogOpacityAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.dialogContainer,
          {
            transform: [{ scale: dialogScaleAnim }],
          },
        ]}
      >
        <View style={styles.dialogWarningIcon}>
          <Text style={styles.dialogWarningText}>⚠️</Text>
        </View>

        <Text style={styles.dialogTitle}>Replace Existing Image?</Text>
        <Text style={styles.dialogMessage}>
          You already have an enrolled face image. Do you want to replace it with the new image or keep using the existing one?
        </Text>

        {existingEnrolledImage && (
          <View style={styles.existingImagePreview}>
            <Text style={styles.existingImageLabel}>Current Enrolled Image:</Text>
            <Image
              source={{ uri: `data:image/jpeg;base64,${existingEnrolledImage}` }}
              style={styles.existingImageThumbnail}
            />
          </View>
        )}

        <View style={styles.dialogDivider} />

        <View style={styles.dialogButtonRow}>
          <TouchableOpacity
            style={styles.dialogSecondaryButton}
            onPress={onUseExisting}
            activeOpacity={0.8}
          >
            <Text style={styles.dialogSecondaryButtonText}>Use Existing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dialogPrimaryButton}
            onPress={onReplace}
            activeOpacity={0.8}
          >
            <Text style={styles.dialogPrimaryButtonText}>Replace</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
});

FaceReplaceDialog.displayName = 'FaceReplaceDialog';

const styles = StyleSheet.create({
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  dialogContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    width: width - 80,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  dialogSuccessIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dialogCheckmark: {
    color: '#fff',
    fontSize: 50,
    fontFamily: 'Sen-Bold',
  },
  dialogTitle: {
    fontSize: 20,
    fontFamily: 'Sen-Bold',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 13,
    fontFamily: 'Sen-Regular',
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  dialogDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 24,
  },
  dialogButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dialogButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Sen-Bold',
  },
  dialogWarningIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dialogWarningText: {
    fontSize: 50,
  },
  existingImagePreview: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  existingImageLabel: {
    fontSize: 14,
    fontFamily: 'Sen-SemiBold',
    color: '#757575',
    marginBottom: 12,
  },
  existingImageThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  dialogButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dialogSecondaryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dialogSecondaryButtonText: {
    color: '#424242',
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
  },
  dialogPrimaryButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dialogPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Sen-Bold',
  },
});

export default FaceEnrollmentDialog;
