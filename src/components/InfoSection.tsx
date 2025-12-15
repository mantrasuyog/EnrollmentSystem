import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Share from 'react-native-share';
import { colors } from '../common/colors';

// URLs for Privacy Policy and Terms of Use pages hosted on Firebase
const PRIVACY_POLICY_URL = 'https://enrollmentsystem-1e0c5.web.app/privacy-policy.html';
const TERMS_OF_USE_URL = 'https://enrollmentsystem-1e0c5.web.app/terms-of-use.html';

// Play Store URL for the app
const APP_PACKAGE_NAME = DeviceInfo.getBundleId();
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${APP_PACKAGE_NAME}`;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Get app version dynamically from native build
const APP_VERSION = DeviceInfo.getVersion();

interface InfoSectionProps {
  isDarkMode: boolean;
  fadeAnim: Animated.Value;
}

interface InfoItemProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  isDarkMode: boolean;
  showArrow?: boolean;
  touchable?: boolean;
}

interface AboutUsModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const AboutUsModal: React.FC<AboutUsModalProps> = ({ visible, onClose, isDarkMode }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, isDarkMode && styles.textLight]}>About Us</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <View style={styles.aboutHeader}>
            <View style={styles.appIconContainer}>
              <Text style={styles.appIcon}>🔐</Text>
            </View>
            <Text style={[styles.appName, isDarkMode && styles.textLight]}>
              {DeviceInfo.getApplicationName()}
            </Text>
            <Text style={[styles.appVersionText, isDarkMode && styles.textLightMuted]}>
              Version {APP_VERSION}
            </Text>
          </View>

          <Text style={[styles.contentTitle, isDarkMode && styles.textLight]}>About the App</Text>
          <Text style={[styles.contentText, isDarkMode && styles.textLightMuted]}>
            Enrollment System is a secure biometric enrollment application designed for identity verification. Using advanced facial recognition and fingerprint scanning technology, we ensure accurate and secure enrollment processes.
          </Text>

          <Text style={[styles.contentTitle, isDarkMode && styles.textLight]}>Features</Text>
          <Text style={[styles.contentText, isDarkMode && styles.textLightMuted]}>
            • Document scanning with NFC support{'\n'}
            • Advanced facial recognition{'\n'}
            • Multi-finger fingerprint capture{'\n'}
            • End-to-end encryption{'\n'}
            • ISO 27001 certified security
          </Text>

          <Text style={[styles.contentTitle, isDarkMode && styles.textLight]}>Contact Us</Text>
          <Text style={[styles.contentText, isDarkMode && styles.textLightMuted]}>
            For support or inquiries, please contact our team.
          </Text>

          <Text style={[styles.contentTitle, isDarkMode && styles.textLight]}>Acknowledgements</Text>
          <Text style={[styles.contentText, isDarkMode && styles.textLightMuted]}>
            Built with React Native and powered by advanced biometric SDKs for secure identity verification.
          </Text>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const InfoItem: React.FC<InfoItemProps> = ({ icon, title, subtitle, onPress, isDarkMode, showArrow = true, touchable = true }) => {
  const content = (
    <>
      <View style={styles.infoIconContainer}>
        <Text style={styles.infoIcon}>{icon}</Text>
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoTitle, isDarkMode && styles.textLight]}>{title}</Text>
        <Text style={[styles.infoSubtitle, isDarkMode && styles.textLightMuted]}>{subtitle}</Text>
      </View>
      {showArrow && touchable && (
        <Text style={[styles.arrow, isDarkMode && styles.textLightMuted]}>›</Text>
      )}
    </>
  );

  if (!touchable) {
    return (
      <View style={[styles.infoItem, isDarkMode && styles.infoItemDark]}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.infoItem, isDarkMode && styles.infoItemDark]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

const InfoSection: React.FC<InfoSectionProps> = ({ isDarkMode, fadeAnim }) => {
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Open Privacy Policy in browser
  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL).catch((err) => {
      if (__DEV__) {
        console.error('Failed to open Privacy Policy:', err);
      }
    });
  };

  // Open Terms of Use in browser
  const openTermsOfUse = () => {
    Linking.openURL(TERMS_OF_USE_URL).catch((err) => {
      if (__DEV__) {
        console.error('Failed to open Terms of Use:', err);
      }
    });
  };

  // Open Play Store for review
  const openPlayStoreForReview = () => {
    Linking.openURL(PLAY_STORE_URL).catch((err) => {
      if (__DEV__) {
        console.error('Failed to open Play Store:', err);
      }
    });
  };

  // Share app with others
  const shareApp = async () => {
    const appName = DeviceInfo.getApplicationName();
    try {
      await Share.open({
        title: `Share ${appName}`,
        message: `Check out ${appName} - A secure biometric enrollment app!\n\n${PLAY_STORE_URL}`,
      });
    } catch (err: any) {
      if (err?.message !== 'User did not share' && __DEV__) {
        console.error('Failed to share app:', err);
      }
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* App Title Section */}
      <View style={[styles.card, isDarkMode && styles.cardDark]}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📱</Text>
          <Text style={[styles.title, isDarkMode && styles.textLight]}>
            {DeviceInfo.getApplicationName()}
          </Text>
        </View>

        <View style={styles.infoList}>
          <InfoItem
            icon="⭐"
            title="Write Review"
            subtitle="Rate us on Play Store"
            onPress={openPlayStoreForReview}
            isDarkMode={isDarkMode}
          />
          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
          <InfoItem
            icon="📤"
            title="Share App"
            subtitle="Share with friends and family"
            onPress={shareApp}
            isDarkMode={isDarkMode}
          />
        </View>
      </View>

      {/* About Section */}
      <View style={[styles.card, styles.cardMarginTop, isDarkMode && styles.cardDark]}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>ℹ️</Text>
          <Text style={[styles.title, isDarkMode && styles.textLight]}>
            About
          </Text>
        </View>

        <View style={styles.infoList}>
          <InfoItem
            icon="🔒"
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={openPrivacyPolicy}
            isDarkMode={isDarkMode}
          />
          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
          <InfoItem
            icon="📋"
            title="Terms of Use"
            subtitle="Usage guidelines and conditions"
            onPress={openTermsOfUse}
            isDarkMode={isDarkMode}
          />
          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
          <InfoItem
            icon="🏷️"
            title="Version"
            subtitle={`v${APP_VERSION}`}
            isDarkMode={isDarkMode}
            touchable={false}
          />
          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
          <InfoItem
            icon="👥"
            title="About Us"
            subtitle="Learn more about the app"
            onPress={() => setShowAboutModal(true)}
            isDarkMode={isDarkMode}
          />
        </View>
      </View>

      <AboutUsModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        isDarkMode={isDarkMode}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#1a1f3d',
  },
  cardMarginTop: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: Math.min(16, screenWidth * 0.04),
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
  },
  textLight: {
    color: colors.white,
  },
  textLightMuted: {
    color: colors.white60,
  },
  infoList: {
    gap: 0,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoItemDark: {},
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.purple1 + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Sen-SemiBold',
    color: colors.darkText,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 11,
    fontFamily: 'Sen-Regular',
    color: colors.midGray,
  },
  arrow: {
    fontSize: 20,
    color: colors.midGray,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderGray,
    marginLeft: 48,
  },
  dividerDark: {
    backgroundColor: '#2a3058',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.75,
    paddingBottom: 30,
  },
  modalContentDark: {
    backgroundColor: '#1a1f3d',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayLight2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.midGray,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  contentTitle: {
    fontSize: 15,
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
    marginTop: 16,
    marginBottom: 8,
  },
  contentText: {
    fontSize: 13,
    fontFamily: 'Sen-Regular',
    color: colors.midGray,
    lineHeight: 20,
  },
  // About Us modal specific styles
  aboutHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.purple1 + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: 20,
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
    marginBottom: 4,
  },
  appVersionText: {
    fontSize: 13,
    fontFamily: 'Sen-Regular',
    color: colors.midGray,
  },
});

export default InfoSection;
