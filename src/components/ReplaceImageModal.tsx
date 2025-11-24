import React, {memo, useEffect, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');

interface ReplaceImageModalProps {
  visible: boolean;
  onClose: () => void;
  onReplace: () => void;
  existingImage?: string;
}

const ReplaceImageModal: React.FC<ReplaceImageModalProps> = memo(
  ({visible, onClose, onReplace, existingImage}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            speed: 12,
            bounciness: 10,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        scaleAnim.setValue(0);
        opacityAnim.setValue(0);
      }
    }, [visible, scaleAnim, opacityAnim]);

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={onClose}>
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: opacityAnim,
            },
          ]}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{scale: scaleAnim}],
              },
            ]}>
            <View style={styles.modalWarningIcon}>
              <Text style={styles.modalWarningText}>⚠️</Text>
            </View>

            <Text style={styles.modalTitle}>Face Already Enrolled</Text>
            <Text style={styles.modalMessage}>
              You already have an enrolled face image. Do you want to replace it
              with a new scan or keep using the existing one?
            </Text>

            {existingImage && (
              <View style={styles.modalImagePreview}>
                <Text style={styles.modalImageLabel}>
                  Current Enrolled Face:
                </Text>
                <Image
                  source={{uri: `data:image/jpeg;base64,${existingImage}`}}
                  style={styles.modalImageThumbnail}
                />
              </View>
            )}

            <View style={styles.modalDivider} />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={onClose}
                activeOpacity={0.8}>
                <Text style={styles.modalSecondaryButtonText}>
                  Keep Existing
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={onReplace}
                activeOpacity={0.8}>
                <Text style={styles.modalPrimaryButtonText}>New Scan</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  },
);

ReplaceImageModal.displayName = 'ReplaceImageModal';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    width: width - 60,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalWarningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF9800',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalWarningText: {
    fontSize: 45,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: 'Sen-Regular',
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalImagePreview: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 16,
  },
  modalImageLabel: {
    fontSize: 13,
    fontFamily: 'Sen-SemiBold',
    color: '#757575',
    marginBottom: 12,
  },
  modalImageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalSecondaryButtonText: {
    color: '#424242',
    fontSize: 15,
    fontFamily: 'Sen-SemiBold',
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Sen-Bold',
  },
});

export default ReplaceImageModal;
