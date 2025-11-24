import React, {memo} from 'react';
import {TouchableOpacity, Text, StyleSheet, Animated} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors as colorTokens } from '../common/colors';

interface ActionButtonProps {
  onPress: () => void;
  text: string;
  icon?: string;
  colors?: string[];
  animValue: Animated.Value;
}

const ActionButton: React.FC<ActionButtonProps> = memo(
  ({onPress, text, icon = '📷', colors = [colorTokens.bluePrimary, colorTokens.deepBlue2], animValue}) => {
    return (
      <Animated.View
        style={[
          styles.bottomActionButtonSection,
          {
            transform: [{scale: animValue}],
          },
        ]}>
        <LinearGradient
          colors={colors}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.bottomActionButtonGradient}>
          <TouchableOpacity
            style={styles.bottomActionButton}
            onPress={onPress}
            activeOpacity={0.8}>
            <Text style={styles.bottomActionButtonIcon}>{icon}</Text>
            <Text style={styles.bottomActionButtonText}>{text}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  },
);

ActionButton.displayName = 'ActionButton';

const styles = StyleSheet.create({
  bottomActionButtonSection: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colorTokens.bluePrimary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 12,
  },
  bottomActionButtonGradient: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bottomActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  bottomActionButtonIcon: {
    fontSize: 18,
  },
  bottomActionButtonText: {
    color: colorTokens.white,
    fontSize: 14,
    fontFamily: 'Sen-Bold',
    letterSpacing: 0.4,
  },
});

export default ActionButton;
