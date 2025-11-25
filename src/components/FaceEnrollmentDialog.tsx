import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { colors } from '../common/colors';

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
    backgroundColor: colors.overlayBlack60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  dialogContainer: {
    backgroundColor: colors.white,
    borderRadius: 25,
    padding: 30,
    width: width - 80,
    alignItems: 'center',
    elevation: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  dialogSuccessIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.green1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: colors.green1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dialogCheckmark: {
    color: colors.white,
    fontSize: 50,
    fontFamily: 'Sen-Bold',
  },
  dialogTitle: {
    fontSize: 20,
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
    marginBottom: 12,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 13,
    fontFamily: 'Sen-Regular',
    color: colors.midGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  dialogDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.borderGray,
    marginBottom: 24,
  },
  dialogButton: {
    backgroundColor: colors.primaryBlue,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dialogButtonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Sen-Bold',
  },
  dialogWarningIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.amber1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: colors.amber1,
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
    color: colors.midGray,
    marginBottom: 12,
  },
  existingImageThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primaryBlue,
  },
  dialogButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dialogSecondaryButton: {
    flex: 1,
    backgroundColor: colors.lightGray2,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  dialogSecondaryButtonText: {
    color: colors.darkText,
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
  },
  dialogPrimaryButton: {
    flex: 1,
    backgroundColor: colors.primaryBlue,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dialogPrimaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Sen-Bold',
  },
});

export default FaceEnrollmentDialog;
