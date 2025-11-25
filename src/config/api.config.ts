export const API_CONFIG = {
  BASE_URL: 'http://10.0.2.2:3000/api',
  TIMEOUT: 30000,
  API_VERSION: 'v1',
}

export const API_ENDPOINTS = {
  BIOMETRIC_ENROLLMENT: '/biometric/enrollment',
  FACE_ENROLLMENT: '/biometric/face',
  FINGERPRINT_ENROLLMENT: '/biometric/fingerprint',

  DOCUMENT_UPLOAD: '/document/upload',
  DOCUMENT_VERIFY: '/document/verify',

  USER_PROFILE: '/user/profile',
  USER_REGISTRATION: '/user/register',
}
