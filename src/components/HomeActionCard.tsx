import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';

const { width: screenWidth } = Dimensions.get('window');

interface HomeActionCardProps {
  title: string;
  description: string;
  icon: string;
  buttonText: string;
  gradientColors: string[];
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  iconAnimation?: Animated.AnimatedInterpolation<string | number>;
}

const HomeActionCard = React.memo<HomeActionCardProps>(({
  title,
  description,
  icon,
  buttonText,
  gradientColors,
  fadeAnim,
  slideAnim,
  scaleAnim,
  onPress,
  onPressIn,
  onPressOut,
  iconAnimation,
}) => {
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}>
          <View style={styles.cardIconWrapper}>
            <Animated.View
              style={[
                styles.cardIconContainer,
                iconAnimation ? { transform: [{ rotate: iconAnimation }] } : undefined
              ]}
            >
              <Text style={styles.cardIcon}>{icon}</Text>
            </Animated.View>
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>{buttonText}</Text>
            <Text style={styles.arrow}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

HomeActionCard.displayName = 'HomeActionCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: Math.min(20, screenWidth * 0.045),
    padding: Math.min(20, screenWidth * 0.045),
    minHeight: Math.min(160, screenWidth * 0.35),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  cardIconWrapper: {
    marginBottom: Math.min(12, screenWidth * 0.025),
  },
  cardIconContainer: {
    width: Math.min(56, screenWidth * 0.12),
    height: Math.min(56, screenWidth * 0.12),
    borderRadius: Math.min(28, screenWidth * 0.06),
    backgroundColor: colors.white30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: Math.min(28, screenWidth * 0.06),
  },
  cardTitle: {
    fontSize: Math.min(20, screenWidth * 0.045),
    fontFamily: 'Sen-Bold',
    color: colors.white,
    marginBottom: Math.min(8, screenWidth * 0.018),
  },
  cardDescription: {
    fontSize: Math.min(13, screenWidth * 0.032),
    fontFamily: 'Sen-Regular',
    color: colors.white,
    opacity: 0.95,
    lineHeight: Math.min(18, screenWidth * 0.04),
    marginBottom: Math.min(12, screenWidth * 0.025),
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardFooterText: {
    fontSize: Math.min(15, screenWidth * 0.035),
    fontFamily: 'Sen-SemiBold',
    color: colors.white,
  },
  arrow: {
    fontSize: Math.min(22, screenWidth * 0.048),
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default HomeActionCard;
