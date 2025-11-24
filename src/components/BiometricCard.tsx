import React, {memo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface BiometricCardProps {
  type: 'face' | 'fingerprint';
  onPress: () => void;
  scaleAnim: Animated.Value;
  scanlineTranslateY: Animated.AnimatedInterpolation<number>;
  cornerOpacity?: Animated.AnimatedInterpolation<number>;
  pulseScale?: Animated.AnimatedInterpolation<number>;
  waveScale1?: Animated.AnimatedInterpolation<number>;
  waveOpacity1?: Animated.AnimatedInterpolation<number>;
  waveScale2?: Animated.AnimatedInterpolation<number>;
  waveOpacity2?: Animated.AnimatedInterpolation<number>;
  frameOpacity?: Animated.AnimatedInterpolation<number>;
}

const BiometricCard: React.FC<BiometricCardProps> = memo(
  ({
    type,
    onPress,
    scaleAnim,
    scanlineTranslateY,
    cornerOpacity,
    pulseScale,
    waveScale1,
    waveOpacity1,
    waveScale2,
    waveOpacity2,
    frameOpacity,
  }) => {
    const isFace = type === 'face';

    const cardConfig = {
      face: {
        gradient: ['#4facfe', '#00f2fe'],
        image: require('../assets/images/face_recognition.png'),
        title: 'Face Scan',
        description: 'Look straight at the camera',
        statusText: 'Ready to scan',
      },
      fingerprint: {
        gradient: ['#667eea', '#764ba2'],
        image: require('../assets/images/fingerprint.png'),
        title: 'Fingerprint Scan',
        description: 'All 10 fingerprints required',
        statusText: null,
      },
    };

    const config = cardConfig[type];

    return (
      <Animated.View
        style={[styles.cardWrapper, {transform: [{scale: scaleAnim}]}]}>
        <TouchableOpacity
          style={styles.card}
          onPress={onPress}
          activeOpacity={1}>
          <LinearGradient
            colors={config.gradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.cardGradient}>
            <View style={styles.biometricDisplay}>
              {isFace ? (
                <View style={styles.faceFrameContainer}>
                  {cornerOpacity && (
                    <>
                      <Animated.View
                        style={[styles.cornerTL, {opacity: cornerOpacity}]}
                      />
                      <Animated.View
                        style={[styles.cornerTR, {opacity: cornerOpacity}]}
                      />
                      <Animated.View
                        style={[styles.cornerBL, {opacity: cornerOpacity}]}
                      />
                      <Animated.View
                        style={[styles.cornerBR, {opacity: cornerOpacity}]}
                      />
                    </>
                  )}

                  <Image
                    source={config.image}
                    style={styles.faceImage}
                    resizeMode="contain"
                  />

                  {frameOpacity && (
                    <Animated.View
                      style={[styles.frameBorder, {opacity: frameOpacity}]}
                    />
                  )}
                </View>
              ) : (
                <View style={styles.fingerprintContainer}>
                  {pulseScale && (
                    <Animated.View
                      style={[
                        styles.fingerprintPulse,
                        {transform: [{scale: pulseScale}]},
                      ]}
                    />
                  )}

                  <Image
                    source={config.image}
                    style={styles.fingerprintImage}
                    resizeMode="contain"
                  />

                  <Animated.View
                    style={[
                      styles.fingerprintScanLine,
                      {transform: [{translateY: scanlineTranslateY}]},
                    ]}
                  />
                </View>
              )}

              <Animated.View
                style={[
                  isFace ? styles.scanningLine : {display: 'none'},
                  {transform: [{translateY: scanlineTranslateY}]},
                ]}
              />

              {!isFace && waveScale1 && waveOpacity1 && (
                <>
                  <Animated.View
                    style={[
                      styles.wave,
                      {transform: [{scale: waveScale1}], opacity: waveOpacity1},
                    ]}
                  />
                  {waveScale2 && waveOpacity2 && (
                    <Animated.View
                      style={[
                        styles.wave,
                        {
                          transform: [{scale: waveScale2}],
                          opacity: waveOpacity2,
                        },
                      ]}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.textContent}>
              <Text style={styles.cardTitle}>{config.title}</Text>
              <Text style={styles.cardDescription}>{config.description}</Text>
            </View>

            {isFace ? (
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{config.statusText}</Text>
              </View>
            ) : (
              <View style={styles.progressContainer}>
                <View style={styles.progressDots}>
                  {[...Array(10)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.progressDot,
                        i < 3 && styles.progressDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

BiometricCard.displayName = 'BiometricCard';

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    width: '75%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  card: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    paddingTop: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  biometricDisplay: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  faceFrameContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frameBorder: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cornerTL: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: '#fff',
    borderTopLeftRadius: 6,
    top: 0,
    left: 0,
    zIndex: 10,
  },
  cornerTR: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#fff',
    borderTopRightRadius: 6,
    top: 0,
    right: 0,
    zIndex: 10,
  },
  cornerBL: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: '#fff',
    borderBottomLeftRadius: 6,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  cornerBR: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#fff',
    borderBottomRightRadius: 6,
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
  faceImage: {
    width: 56,
    height: 56,
  },
  scanningLine: {
    position: 'absolute',
    width: 56,
    height: 1.5,
    backgroundColor: '#fff',
    borderRadius: 1,
    shadowColor: '#fff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  fingerprintContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fingerprintPulse: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: '#fff',
    opacity: 0.5,
  },
  fingerprintImage: {
    width: 50,
    height: 56,
  },
  fingerprintScanLine: {
    position: 'absolute',
    width: 48,
    height: 1.5,
    backgroundColor: '#fff',
    borderRadius: 1,
    shadowColor: '#fff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  wave: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Sen-Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.92)',
    fontFamily: 'Sen-Regular',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 2.5,
    elevation: 2,
  },
});

export default BiometricCard;
