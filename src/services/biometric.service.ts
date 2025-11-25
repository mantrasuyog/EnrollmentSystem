import { apiService } from './api.service'
import { API_ENDPOINTS } from '../config/api.config'

export interface BiometricEnrollmentRequest {
  userId?: string
  faceImageBase64?: string
  fingerprintData?: string
  enrollmentType: 'face' | 'fingerprint' | 'both'
  metadata?: {
    deviceId?: string
    timestamp?: string
    [key: string]: any
  }
}

export interface BiometricEnrollmentResponse {
  success: boolean
  message: string
  data?: {
    enrollmentId: string
    userId: string
    enrollmentType: string
    createdAt: string
    [key: string]: any
  }
}

export const biometricService = {
  submitBiometricEnrollment: async (
    data: BiometricEnrollmentRequest
  ): Promise<BiometricEnrollmentResponse> => {
    try {
      const response = await apiService.post<BiometricEnrollmentResponse>(
        API_ENDPOINTS.BIOMETRIC_ENROLLMENT,
        data
      )
      return response.data
    } catch (error: any) {
      console.error('Biometric enrollment error:', error)
      throw {
        success: false,
        message: error.response?.data?.message || 'Failed to submit biometric enrollment',
        error: error.message,
      }
    }
  },

  submitFaceEnrollment: async (
    faceImageBase64: string,
    userId?: string
  ): Promise<BiometricEnrollmentResponse> => {
    try {
      const response = await apiService.post<BiometricEnrollmentResponse>(
        API_ENDPOINTS.FACE_ENROLLMENT,
        {
          userId,
          faceImageBase64,
          timestamp: new Date().toISOString(),
        }
      )
      return response.data
    } catch (error: any) {
      console.error('Face enrollment error:', error)
      throw {
        success: false,
        message: error.response?.data?.message || 'Failed to submit face enrollment',
        error: error.message,
      }
    }
  },

  submitFingerprintEnrollment: async (
    fingerprintData: string,
    userId?: string
  ): Promise<BiometricEnrollmentResponse> => {
    try {
      const response = await apiService.post<BiometricEnrollmentResponse>(
        API_ENDPOINTS.FINGERPRINT_ENROLLMENT,
        {
          userId,
          fingerprintData,
          timestamp: new Date().toISOString(),
        }
      )
      return response.data
    } catch (error: any) {
      console.error('Fingerprint enrollment error:', error)
      throw {
        success: false,
        message: error.response?.data?.message || 'Failed to submit fingerprint enrollment',
        error: error.message,
      }
    }
  },
}

export default biometricService
