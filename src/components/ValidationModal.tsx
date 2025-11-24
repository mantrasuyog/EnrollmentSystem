import React, {memo, useEffect, useRef, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface ValidationStep {
  number: number;
  text: string;
}

interface ValidationModalProps {
  visible: boolean;
  onClose: () => void;
  icon: string;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  steps: ValidationStep[];
  buttonGradient: string[];
  numberBackgroundColor: string;
}

const ValidationModal: React.FC<ValidationModalProps> = memo(
  ({
    visible,
    onClose,
    icon,
    iconBackgroundColor,
    title,
    subtitle,
    steps,
    buttonGradient,
    numberBackgroundColor,
  }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
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
    }, [visible]);

    const handleClose = useCallback(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
      });
    }, [onClose, scaleAnim, opacityAnim]);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}>
        <View style={styles.validationModalOverlay}>
          <TouchableOpacity
            style={styles.validationModalBackground}
            activeOpacity={1}
            onPress={handleClose}
          />
          <Animated.View
            style={[
              styles.validationModalContent,
              {
                transform: [{scale: scaleAnim}],
                opacity: opacityAnim,
              },
            ]}>
            <View
              style={[
                styles.validationIconContainer,
                {backgroundColor: iconBackgroundColor},
              ]}>
              <Animated.View style={styles.validationIconGlow}>
                <Text style={styles.validationIcon}>{icon}</Text>
              </Animated.View>
            </View>

            <Text style={styles.validationModalTitle}>{title}</Text>
            <Text style={styles.validationModalSubtitle}>{subtitle}</Text>

            <View style={styles.validationStepsContainer}>
              {steps.map((step, index) => (
                <View key={index} style={styles.validationStepRow}>
                  <View
                    style={[
                      styles.validationStepNumber,
                      {backgroundColor: numberBackgroundColor},
                    ]}>
                    <Text style={styles.validationStepNumberText}>
                      {step.number}
                    </Text>
                  </View>
                  <Text style={styles.validationStepText}>{step.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.validationButton}
              onPress={handleClose}>
              <LinearGradient
                colors={buttonGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.validationButtonGradient}>
                <Text style={styles.validationButtonText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  },
);

ValidationModal.displayName = 'ValidationModal';

const styles = StyleSheet.create({
  validationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  validationModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  validationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  validationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  validationIconGlow: {
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  validationIcon: {
    fontSize: 48,
  },
  validationModalTitle: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  validationModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  validationStepsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  validationStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  validationStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  validationStepNumberText: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: '#fff',
  },
  validationStepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Sen-SemiBold',
    color: '#334155',
  },
  validationButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  validationButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  validationButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Sen-Bold',
    letterSpacing: 0.5,
  },
});

export default ValidationModal;
