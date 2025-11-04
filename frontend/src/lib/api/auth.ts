import { api } from '../api'

export interface User {
  id: string
  email: string
  tier: 'free' | 'solo' | 'pro' | 'label'
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  tier?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const formData = new FormData()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)

    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },

  /**
   * Get current user info
   */
  me: async (): Promise<User> => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  /**
   * Logout (client-side token removal)
   */
  logout: () => {
    localStorage.removeItem('token')
  }
}
