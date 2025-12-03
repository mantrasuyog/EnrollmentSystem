import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { API_CONFIG, API_ENDPOINTS } from '../config/api.config'

const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    console.log('========== API REQUEST ==========')
    console.log('Method:', config.method?.toUpperCase())
    console.log('URL:', (config.baseURL || '') + (config.url || ''))
    console.log('Headers:', JSON.stringify(config.headers, null, 2))
    console.log('Request Body:', JSON.stringify(config.data, null, 2))
    console.log('=================================')

    return config
  },
  (error: AxiosError) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('========== API RESPONSE ==========')
    console.log('Status:', response.status)
    console.log('URL:', response.config.url)
    console.log('Response Data:', JSON.stringify(response.data, null, 2))
    console.log('==================================')

    return response
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response

      if (__DEV__) {
        console.error('API Error Response:', {
          status,
          data,
          url: error.config?.url,
        })
      }

      switch (status) {
        case 401:
          console.error('Unauthorized access - please login again')
          break
        case 403:
          console.error('Access forbidden')
          break
        case 404:
          console.error('Resource not found')
          break
        case 500:
          console.error('Server error occurred')
          break
        default:
          console.error(`Error ${status}:`, data)
      }
    } else if (error.request) {
      console.error('Network Error: No response received', error.message)
    } else {
      console.error('Request Setup Error:', error.message)
    }

    return Promise.reject(error)
  }
)

export interface UserExistsResponse {
  message: string
  status: string
  user?: {
    id: number
    registration_id: string
    center_code: string
    name: string
    document_image: string
    portrait_image: string
    scanned_json: {
      dob: string
      gender: string
      document_type: string
      'Document number': string
    }
    created_at: string
    updated_at: string
  }
}

export const apiService = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config)
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config)
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config)
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config)
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config)
  },

  checkUserExists: async (registrationId: string): Promise<UserExistsResponse> => {
    const response = await apiClient.get<UserExistsResponse>(`${API_ENDPOINTS.USER_EXISTS}/${registrationId}`)
    return response.data
  },
}

export default apiService
