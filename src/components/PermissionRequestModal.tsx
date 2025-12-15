import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';
import {
  checkAllPermissions,
  requestAllPermissions,
  areAllPermissionsGranted,
  openAppSettings,
} from '../services/permissions.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: screenHeight } = Dimensions.get('window');

const PERMISSION_MODAL_SHOWN_KEY = 'permission_modal_shown';

interface PermissionRequestModalProps {
  onPermissionsGranted: () => void;
  onSkip?: () => void;
}

interface PermissionItemData {
  key: string;
  icon: string;
  title: string;
  description: string;
  usage: string;
}

const getPermissionItems = (): PermissionItemData[] => {
  const items: PermissionItemData[] = [
    {
      key: 'camera',
      icon: '📷',
      title: 'Camera Access',
      description: 'Required for biometric enrollment',
      usage: 'We use your camera to capture facial images for identity verification and to scan documents. Your biometric data is encrypted and stored securely.',
    },
  ];

  return items;
};

const PermissionItem: React.FC<{ item: PermissionItemData }> = ({ item }) => (
  <View style={styles.permissionItem}>
    <View style={styles.permissionHeader}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.permissionTitle}>{item.title}</Text>
        <Text style={styles.permissionDesc}>{item.description}</Text>
      </View>
    </View>
    <Text style={styles.usageText}>{item.usage}</Text>
  </View>
);

const PermissionRequestModal: React.FC<PermissionRequestModalProps> = ({
  onPermissionsGranted,
  onSkip,
}) => {
  const [visible, setVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showBlockedMessage, setShowBlockedMessage] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const checkAndShowModal = useCallback(async () => {
    // Check if permissions already granted
    const results = await checkAllPermissions();

    if (areAllPermissionsGranted(results)) {
      // Permissions granted, don't show modal
      onPermissionsGranted();
      return;
    }

    // Check if we've already shown the modal before (only show once on first app launch)
    const modalAlreadyShown = await AsyncStorage.getItem(PERMISSION_MODAL_SHOWN_KEY);
    if (modalAlreadyShown === 'true') {
      // Modal was already shown before, don't show again
      return;
    }

    // First time showing the modal
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, onPermissionsGranted]);

  useEffect(() => {
    checkAndShowModal();
  }, [checkAndShowModal]);

  const handleGrantPermissions = async () => {
    setIsRequesting(true);
    setShowBlockedMessage(false);

    try {
      const results = await requestAllPermissions();

      // Mark modal as shown so it won't appear again
      await AsyncStorage.setItem(PERMISSION_MODAL_SHOWN_KEY, 'true');

      if (areAllPermissionsGranted(results)) {
        closeModal();
        onPermissionsGranted();
      } else {
        // Check if any permission is blocked
        const hasBlocked = Object.values(results).some(
          status => status === 'blocked'
        );
        if (hasBlocked) {
          setShowBlockedMessage(true);
        }
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = async () => {
    await openAppSettings();
  };

  const handleSkip = async () => {
    // Mark modal as shown so it won't appear again
    await AsyncStorage.setItem(PERMISSION_MODAL_SHOWN_KEY, 'true');
    closeModal();
    onSkip?.();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const permissionItems = getPermissionItems();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleSkip}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={[colors.purple1, colors.purple2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerIconContainer}>
              <Text style={styles.headerIcon}>🔐</Text>
            </View>
            <Text style={styles.headerTitle}>Permissions Required</Text>
            <Text style={styles.headerSubtitle}>
              To provide you with the best enrollment experience, we need access to the following:
            </Text>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {permissionItems.map((item) => (
              <PermissionItem key={item.key} item={item} />
            ))}

            {showBlockedMessage && (
              <View style={styles.blockedMessage}>
                <Text style={styles.blockedIcon}>⚠️</Text>
                <Text style={styles.blockedText}>
                  Some permissions were denied. Please enable them in Settings to use all features.
                </Text>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={handleOpenSettings}
                  activeOpacity={0.8}
                >
                  <Text style={styles.settingsButtonText}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.privacyNote}>
              <Text style={styles.privacyIcon}>🛡️</Text>
              <Text style={styles.privacyText}>
                Your privacy is important to us. All data is encrypted and securely stored following ISO 27001 standards.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.grantButton}
              onPress={handleGrantPermissions}
              disabled={isRequesting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.purple1, colors.purple2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.grantButtonGradient}
              >
                <Text style={styles.grantButtonText}>
                  {isRequesting ? 'Requesting...' : 'Grant Permissions'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: screenHeight * 0.85,
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerGradient: {
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 36,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.white80,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    maxHeight: screenHeight * 0.4,
  },
  contentContainer: {
    padding: 20,
  },
  permissionItem: {
    backgroundColor: colors.grayLight2,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.purple1 + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  titleContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 15,
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
    marginBottom: 2,
  },
  permissionDesc: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.midGray,
  },
  usageText: {
    fontSize: 13,
    fontFamily: 'Sen-Regular',
    color: colors.darkText,
    lineHeight: 19,
    opacity: 0.8,
  },
  blockedMessage: {
    backgroundColor: colors.dangerLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  blockedIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  blockedText: {
    fontSize: 13,
    fontFamily: 'Sen-Regular',
    color: colors.danger2,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  settingsButton: {
    backgroundColor: colors.danger1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 13,
    fontFamily: 'Sen-SemiBold',
    color: colors.white,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.green1 + '15',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  privacyIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.green2,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderGray,
  },
  grantButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  grantButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  grantButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: colors.white,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Sen-SemiBold',
    color: colors.midGray,
  },
});

export default PermissionRequestModal;
