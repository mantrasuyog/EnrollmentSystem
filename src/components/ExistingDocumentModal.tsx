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
  ScrollView,
} from 'react-native';

const {width, height} = Dimensions.get('window');

interface ExistingDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onUseExisting: () => void;
  onUploadNew: () => void;
  documentImage?: string;
  portraitImage?: string;
  scannedData?: string;
}

const ExistingDocumentModal: React.FC<ExistingDocumentModalProps> = memo(
  ({
    visible,
    onClose,
    onUseExisting,
    onUploadNew,
    documentImage,
    portraitImage,
    scannedData,
  }) => {
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

    const parsedData = React.useMemo(() => {
      try {
        return scannedData ? JSON.parse(scannedData) : [];
      } catch {
        return [];
      }
    }, [scannedData]);

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
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={onClose}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{scale: scaleAnim}],
              },
            ]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalWarningIcon}>
                <Text style={styles.modalWarningText}>📄</Text>
              </View>
              <Text style={styles.modalTitle}>Document Already Exists</Text>
              <Text style={styles.modalMessage}>
                You have already scanned a document. Would you like to use the
                existing one or upload a new document?
              </Text>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={true}>
              {/* Images Section */}
              <View style={styles.imagesSection}>
                {documentImage && (
                  <View style={styles.imageContainer}>
                    <Text style={styles.imageLabel}>Document Image:</Text>
                    <Image
                      source={{uri: documentImage}}
                      style={styles.documentImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {portraitImage && (
                  <View style={styles.imageContainer}>
                    <Text style={styles.imageLabel}>Portrait Image:</Text>
                    <Image
                      source={{uri: portraitImage}}
                      style={styles.portraitImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>

              {/* JSON Data Section */}
              {parsedData.length > 0 && (
                <View style={styles.jsonSection}>
                  <Text style={styles.jsonTitle}>Document Details:</Text>
                  <View style={styles.jsonContainer}>
                    {parsedData.map((field: any, index: number) => (
                      <View key={index} style={styles.jsonRow}>
                        <Text style={styles.jsonKey}>{field.name}:</Text>
                        <Text style={styles.jsonValue} numberOfLines={2}>
                          {field.value || 'N/A'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalDivider} />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={onUseExisting}
                activeOpacity={0.8}>
                <Text style={styles.modalPrimaryButtonText}>
                  ✓ Use Existing & Proceed to Step 2
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={onUploadNew}
                  activeOpacity={0.8}>
                  <Text style={styles.modalSecondaryButtonText}>
                    📷 Upload New
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={onClose}
                  activeOpacity={0.8}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  },
);

ExistingDocumentModal.displayName = 'ExistingDocumentModal';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width - 40,
    maxWidth: 500,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalWarningIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#FF9800',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalWarningText: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Sen-Bold',
    color: '#212121',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: '#757575',
    textAlign: 'center',
    lineHeight: 17,
  },
  modalContent: {
    maxHeight: height * 0.45,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  imagesSection: {
    marginBottom: 12,
  },
  imageContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 12,
    fontFamily: 'Sen-SemiBold',
    color: '#424242',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  documentImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  portraitImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: '#F5F5F5',
  },
  jsonSection: {
    marginTop: 4,
  },
  jsonTitle: {
    fontSize: 13,
    fontFamily: 'Sen-Bold',
    color: '#212121',
    marginBottom: 8,
  },
  jsonContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jsonRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  jsonKey: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Sen-SemiBold',
    color: '#424242',
  },
  jsonValue: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Sen-Regular',
    color: '#757575',
    textAlign: 'right',
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  modalButtonContainer: {
    padding: 16,
    gap: 10,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalPrimaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Sen-Bold',
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSecondaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Sen-SemiBold',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelButtonText: {
    color: '#757575',
    fontSize: 13,
    fontFamily: 'Sen-SemiBold',
  },
});

export default ExistingDocumentModal;
