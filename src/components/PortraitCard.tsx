import React, {memo} from 'react';
import {View, Text, Image, StyleSheet, ImageSourcePropType} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface PortraitCardProps {
  portrait: ImageSourcePropType | {uri: string};
}

const PortraitCard: React.FC<PortraitCardProps> = memo(({portrait}) => {
  const hasUri = typeof portrait === 'object' && 'uri' in portrait;

  return (
    <View style={styles.portraitSmallContainer}>
      <Text style={styles.portraitSmallLabel}>Portrait</Text>
      <LinearGradient
        colors={['#f0f9ff', '#e0f2fe', '#bae6fd']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.portraitSmallCard}>
        <View style={styles.portraitSmallFrame}>
          <Image
            style={styles.portraitSmallImage}
            source={portrait}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.portraitSmallStatus}>
          {hasUri ? '✓ Captured' : 'Pending'}
        </Text>
      </LinearGradient>
    </View>
  );
});

PortraitCard.displayName = 'PortraitCard';

const styles = StyleSheet.create({
  portraitSmallContainer: {
    marginBottom: 6,
  },
  portraitSmallLabel: {
    fontSize: 10,
    color: '#1E293B',
    fontFamily: 'Sen-Bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 2,
  },
  portraitSmallCard: {
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  portraitSmallFrame: {
    width: 45,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitSmallImage: {
    height: 50,
    width: 40,
    borderRadius: 6,
  },
  portraitSmallStatus: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    fontFamily: 'Sen-Bold',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

export default PortraitCard;
