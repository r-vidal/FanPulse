'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter()
  const { isAuthenticated, token, setUser, logout, setLoading } = useAuthStore()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      // Check if we have a token in store or localStorage
      const storedToken = token || localStorage.getItem('token')

      if (!storedToken) {
        setIsVerifying(false)
        setLoading(false)
        router.push('/login')
        return
      }

      try {
        // Verify token with backend
        const response = await api.get('/api/auth/me')

        if (response.data) {
          // Token is valid, update user info
          setUser(response.data)
          setIsVerifying(false)
          setLoading(false)
        }
      } catch (error) {
        console.error('Token verification failed:', error)
        // Token is invalid or expired
        logout()
        setIsVerifying(false)
        setLoading(false)
        router.push('/login')
      }
    }

    verifyAuth()
  }, []) // Only run once on mount

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
