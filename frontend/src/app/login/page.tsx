'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/lib/validations/auth'
import { login as apiLogin } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      const response = await apiLogin({
        email: data.email,
        password: data.password,
      })

      login(response.user, response.access_token)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(
        err.response?.data?.detail || 'Login failed. Please check your credentials.'
      )
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert type="error" title="Login Failed">
            {error}
          </Alert>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          error={errors.email?.message}
          {...register('email')}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
          required
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isSubmitting}
        >
          Sign In
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
