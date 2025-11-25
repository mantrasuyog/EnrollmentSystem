import React, { useEffect, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { colors } from '../common/colors'
import LinearGradient from 'react-native-linear-gradient'

const { width } = Dimensions.get('window')

interface ApiResponseDialogProps {
  visible: boolean
  type: 'success' | 'error'
  title?: string
  message: string
  onClose: () => void
}

const ApiResponseDialog: React.FC<ApiResponseDialogProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const iconRotateAnim = useRef(new Animated.Value(0)).current
  const iconScaleAnim = useRef(new Animated.Value(0)).current
  const checkmarkAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0)
      fadeAnim.setValue(0)
      iconScaleAnim.setValue(0)
      iconRotateAnim.setValue(0)
      checkmarkAnim.setValue(0)
      pulseAnim.setValue(1)

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(iconRotateAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start()

      if (type === 'success') {
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(checkmarkAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start()

        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start()
      }
    }
  }, [visible, type])

  const iconRotate = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const getGradientColors = () => {
    if (type === 'success') {
      return ['#4A90E2', '#5BA3F5'] // Blue gradient
    }
    return ['#4A90E2', '#5BA3F5'] // Blue gradient for both
  }

  const getIcon = () => {
    if (type === 'success') {
      return (
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: iconScaleAnim }, { rotate: iconRotate }],
            },
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <Text style={styles.iconText}>✓</Text>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      )
    }

    return (
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: iconScaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Animated.View
            style={{
              transform: [{ rotate: iconRotate }],
            }}
          >
            <Text style={styles.iconText}>✕</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    )
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.dialog}>
            <View style={styles.dialogBackground}>
              {getIcon()}

              <Text style={styles.title}>
                {title || (type === 'success' ? 'Success!' : 'Error')}
              </Text>

              <Text style={styles.message}>{message}</Text>

              <TouchableOpacity
                style={styles.button}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={getGradientColors()}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: width * 0.85,
  },
  dialog: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: colors.white,
  },
  dialogBackground: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  iconContainer: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconText: {
    fontSize: 40,
    color: colors.white,
    fontFamily: 'Sen-Bold',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Sen-Bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    letterSpacing: 0.5,
  },
})

export default ApiResponseDialog
