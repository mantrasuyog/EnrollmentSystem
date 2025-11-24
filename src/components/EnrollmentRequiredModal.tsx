import React, {memo, useEffect, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const {width} = Dimensions.get('window');

interface EnrollmentRequiredModalProps {
  visible: boolean;
  onClose: () => void;
}

const EnrollmentRequiredModal: React.FC<EnrollmentRequiredModalProps> = memo(
  ({visible, onClose}) => {
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
              styles.enrollmentRequiredContainer,
              {
                transform: [{scale: scaleAnim}],
              },
            ]}>
            <Animated.View style={styles.enrollmentRequiredIconWrapper}>
              <View style={styles.enrollmentRequiredIcon}>
                <Text style={styles.enrollmentRequiredIconText}>🔒</Text>
              </View>
              <View style={styles.enrollmentRequiredIconGlow} />
            </Animated.View>

            <Text style={styles.enrollmentRequiredTitle}>
              Face Enrollment Required
            </Text>

            <Text style={styles.enrollmentRequiredMessage}>
              Please complete your face enrollment before proceeding to document
              upload.
            </Text>

            <View style={styles.enrollmentRequiredStepsContainer}>
              <View style={styles.enrollmentRequiredStep}>
                <View style={styles.enrollmentRequiredStepIcon}>
                  <Text style={styles.enrollmentRequiredStepIconText}>👤</Text>
                </View>
                <Text style={styles.enrollmentRequiredStepText}>
                  Tap "Face Scan" above
                </Text>
              </View>
              <View style={styles.enrollmentRequiredStep}>
                <View style={styles.enrollmentRequiredStepIcon}>
                  <Text style={styles.enrollmentRequiredStepIconText}>📸</Text>
                </View>
                <Text style={styles.enrollmentRequiredStepText}>
                  Capture your face
                </Text>
              </View>
              <View style={styles.enrollmentRequiredStep}>
                <View style={styles.enrollmentRequiredStepIcon}>
                  <Text style={styles.enrollmentRequiredStepIconText}>✓</Text>
                </View>
                <Text style={styles.enrollmentRequiredStepText}>
                  Then continue here
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.enrollmentRequiredButton}
              onPress={onClose}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.enrollmentRequiredButtonGradient}>
                <Text style={styles.enrollmentRequiredButtonText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  },
);

EnrollmentRequiredModal.displayName = 'EnrollmentRequiredModal';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  enrollmentRequiredContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    width: width - 60,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 15},
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 20,
  },
  enrollmentRequiredIconWrapper: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollmentRequiredIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  enrollmentRequiredIconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea',
    opacity: 0.2,
  },
  enrollmentRequiredIconText: {
    fontSize: 50,
  },
  enrollmentRequiredTitle: {
    fontSize: 24,
    fontFamily: 'Sen-Bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  enrollmentRequiredMessage: {
    fontSize: 15,
    fontFamily: 'Sen-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  enrollmentRequiredStepsContainer: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  enrollmentRequiredStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  enrollmentRequiredStepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  enrollmentRequiredStepIconText: {
    fontSize: 20,
  },
  enrollmentRequiredStepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Sen-SemiBold',
    color: '#334155',
  },
  enrollmentRequiredButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  enrollmentRequiredButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  enrollmentRequiredButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Sen-Bold',
    letterSpacing: 0.5,
  },
});

export default EnrollmentRequiredModal;
