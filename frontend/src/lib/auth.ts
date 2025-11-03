import api from './api'
import { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
}

export interface MessageResponse {
  message: string
}

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<User> => {
  const response = await api.post<User>('/api/auth/register', data)
  return response.data
}

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // FastAPI OAuth2 expects form data
  const formData = new FormData()
  formData.append('username', credentials.email)
  formData.append('password', credentials.password)

  const response = await api.post<{ access_token: string; token_type: string }>(
    '/api/auth/login',
    formData,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  // Get user info after login
  const userResponse = await api.get<User>('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${response.data.access_token}`,
    },
  })

  return {
    user: userResponse.data,
    access_token: response.data.access_token,
    token_type: response.data.token_type,
  }
}

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/api/auth/me')
  return response.data
}

/**
 * Request password reset
 */
export const forgotPassword = async (email: string): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/api/auth/forgot-password', { email })
  return response.data
}

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/api/auth/reset-password', {
    token,
    new_password: newPassword,
  })
  return response.data
}

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>(`/api/auth/verify-email?token=${token}`)
  return response.data
}

/**
 * Resend verification email
 */
export const resendVerification = async (email: string): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/api/auth/resend-verification', { email })
  return response.data
}

/**
 * Logout (client-side only)
 */
export const logout = (): void => {
  localStorage.removeItem('token')
}
