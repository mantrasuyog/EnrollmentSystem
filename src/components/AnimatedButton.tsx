import React, {memo, useCallback, useRef} from 'react';
import {
  TouchableOpacity,
  Animated,
  Text,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';

interface AnimatedButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isPrimary?: boolean;
  children: React.ReactNode;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = memo(
  ({onPress, disabled = false, isPrimary = false, children}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, [scaleAnim]);

    const handlePress = useCallback(() => {
      if (!disabled) onPress();
    }, [disabled, onPress]);

    return (
      <Animated.View style={{flex: 1, transform: [{scale: scaleAnim}]}}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}>
          {isPrimary ? (
            <LinearGradient
              colors={[colors.purple1, colors.purple2]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[
                styles.button,
                styles.buttonPrimary,
                disabled && styles.buttonDisabled,
              ]}>
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {children}
              </Text>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={[colors.lightGray2, colors.white]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.button, disabled && styles.buttonDisabled]}>
              <Text style={styles.buttonText}>{children}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

AnimatedButton.displayName = 'AnimatedButton';

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPrimary: {
    borderColor: 'transparent',
    shadowColor: colors.purple1,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.darkText,
  },
  buttonTextPrimary: {
    color: colors.white,
    letterSpacing: 0.5,
  },
});

export default AnimatedButton;
