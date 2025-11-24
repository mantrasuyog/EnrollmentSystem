import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native'
import React, { useCallback, useState, memo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../redux/store'
import { clearEnrolledImage } from '../redux/faceEnrollmentSlice'
import LinearGradient from 'react-native-linear-gradient'
import { colors } from '../common/colors'
import BiometricCard from '../components/BiometricCard'
import ReplaceImageModal from '../components/ReplaceImageModal'
import EnrollmentRequiredModal from '../components/EnrollmentRequiredModal'
import AnimatedBubble from '../components/AnimatedBubble'
import { useEnrollmentAnimations } from '../hooks/useEnrollmentAnimations'

const { height } = Dimensions.get('window')

interface FaceAndFingerEnrollmentScreenProps {
  onFacePress?: () => void
  onFingerPress?: () => void
  isComponent?: boolean
  onProceedToNext?: () => void
}

const BackgroundBubbles = memo(() => {
  const animations = useEnrollmentAnimations()

  const bubbles = [
    { size: 40, top: height * 0.1, left: 20, translateX: -30, transform: animations.bubble1Transform },
    { size: 60, top: height * 0.15, right: 30, translateX: 40, transform: animations.bubble2Transform },
    { size: 35, top: height * 0.25, left: -10, translateX: -50, transform: animations.bubble3Transform },
    { size: 80, top: height * 0.3, right: -20, translateX: 60, transform: animations.bubble4Transform },
    { size: 45, top: height * 0.35, left: undefined, right: undefined, translateX: 20, transform: animations.bubble5Transform },
  ]

  return (
    <>
      {bubbles.map((bubble, index) => (
        <AnimatedBubble
          key={index}
          translateYAnim={bubble.transform}
          translateX={bubble.translateX}
          size={bubble.size}
          top={bubble.top}
          left={bubble.left}
          right={bubble.right}
        />
      ))}
    </>
  )
})

BackgroundBubbles.displayName = 'BackgroundBubbles'

const Header = memo(() => (
  <View style={styles.header}>
    <Text style={styles.mainTitle}>Secure Enrollment</Text>
    <Text style={styles.subtitle}>
      Choose your biometric authentication method
    </Text>
  </View>
))

Header.displayName = 'Header'

const Footer = memo(({
  isComponent,
  onProceedToNext
}: {
  isComponent: boolean
  onProceedToNext?: () => void
}) => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>
      🔒 Your biometric data is encrypted and stored securely
    </Text>

    {isComponent && onProceedToNext && (
      <TouchableOpacity
        style={styles.doneButton}
        onPress={onProceedToNext}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.green1, colors.green2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.doneButtonGradient}
        >
          <Text style={styles.doneButtonText}>
            ✓ Done with Biometric Enrollment
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </View>
))

Footer.displayName = 'Footer'

const FaceAndFingerEnrollmentScreen = ({
  onFacePress,
  onFingerPress,
  isComponent = false,
  onProceedToNext
}: FaceAndFingerEnrollmentScreenProps) => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const existingEnrolledImage = useSelector((state: RootState) => state.faceEnrollment.enrolledImageBase64)

  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [showEnrollmentRequiredModal, setShowEnrollmentRequiredModal] = useState(false)

  const animations = useEnrollmentAnimations()

  const navigateToFaceScan = useCallback(() => {
    if (onFacePress) {
      onFacePress()
    } else {
      navigation?.navigate('FaceRecongition' as never)
    }
  }, [onFacePress, navigation])

  const handleFacePress = useCallback(() => {
    console.log('Face Scan Pressed')
    Animated.sequence([
      Animated.timing(animations.faceScaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animations.faceScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (existingEnrolledImage) {
        setShowReplaceModal(true)
      } else {
        navigateToFaceScan()
      }
    })
  }, [animations.faceScaleAnim, existingEnrolledImage, navigateToFaceScan])

  const handleReplaceExistingImage = useCallback(() => {
    dispatch(clearEnrolledImage())
    setShowReplaceModal(false)
    navigateToFaceScan()
  }, [dispatch, navigateToFaceScan])

  const handleUseExistingImage = useCallback(() => {
    setShowReplaceModal(false)
  }, [])

  const handleFingerPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(animations.fingerScaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animations.fingerScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onFingerPress) {
        onFingerPress()
      } else {
        navigation?.navigate('FingerprintScanScreen' as never)
      }
    })
  }, [animations.fingerScaleAnim, onFingerPress, navigation])

  const handleProceedToNext = useCallback(() => {
    if (!existingEnrolledImage) {
      setShowEnrollmentRequiredModal(true)
      return
    }

    if (onProceedToNext) {
      onProceedToNext()
    }
  }, [existingEnrolledImage, onProceedToNext])

  const closeEnrollmentRequiredModal = useCallback(() => {
    setShowEnrollmentRequiredModal(false)
  }, [])

  const Content = memo(() => (
    <>
      <LinearGradient
        colors={[colors.deepBlue1, colors.deepBlue2, colors.deepBlue3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      <BackgroundBubbles />

      <Header />

      <View style={styles.cardsContainer}>
        <BiometricCard
          type="face"
          onPress={handleFacePress}
          scaleAnim={animations.faceScaleAnim}
          scanlineTranslateY={animations.faceScanlineTranslateY}
          cornerOpacity={animations.cornerOpacity}
          frameOpacity={animations.faceFrameOpacity}
        />

        <BiometricCard
          type="fingerprint"
          onPress={handleFingerPress}
          scaleAnim={animations.fingerScaleAnim}
          scanlineTranslateY={animations.fingerScanlineTranslateY}
          pulseScale={animations.fingerPulseScale}
          waveScale1={animations.waveScale1}
          waveOpacity1={animations.waveOpacity1}
          waveScale2={animations.waveScale2}
          waveOpacity2={animations.waveOpacity2}
        />
      </View>

      <Footer
        isComponent={isComponent}
        onProceedToNext={handleProceedToNext}
      />
    </>
  ))

  Content.displayName = 'Content'

  if (isComponent) {
    return (
      <View style={styles.container}>
        <Content />
        <ReplaceImageModal
          visible={showReplaceModal}
          onClose={handleUseExistingImage}
          onReplace={handleReplaceExistingImage}
          existingImage={existingEnrolledImage || undefined}
        />
        <EnrollmentRequiredModal
          visible={showEnrollmentRequiredModal}
          onClose={closeEnrollmentRequiredModal}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Content />
      <ReplaceImageModal
        visible={showReplaceModal}
        onClose={handleUseExistingImage}
        onReplace={handleReplaceExistingImage}
        existingImage={existingEnrolledImage || undefined}
      />
      <EnrollmentRequiredModal
        visible={showEnrollmentRequiredModal}
        onClose={closeEnrollmentRequiredModal}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.deepBlue1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  mainTitle: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: colors.white,
    marginBottom: 4,
    textShadowColor: colors.black20,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Sen-Regular',
    color: colors.white80,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  footerText: {
    fontSize: 11,
    color: colors.white75,
    fontFamily: 'Sen-SemiBold',
    textAlign: 'center',
    lineHeight: 16,
  },
  doneButton: {
    marginTop: 12,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: colors.green1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  doneButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Sen-Bold',
    letterSpacing: 0.3,
  },
})

export default FaceAndFingerEnrollmentScreen
