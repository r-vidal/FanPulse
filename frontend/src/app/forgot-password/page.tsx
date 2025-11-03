'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations/auth'
import { forgotPassword } from '@/lib/auth'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError(null)
      await forgotPassword(data.email)
      setSuccess(true)
    } catch (err: any) {
      console.error('Forgot password error:', err)
      setError(
        err.response?.data?.detail || 'Failed to send reset email. Please try again.'
      )
    }
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset link"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert type="error" title="Error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert type="success" title="Email Sent!">
            If an account exists with that email, you will receive a password reset link shortly.
            Check your inbox and spam folder.
          </Alert>
        )}

        {!success && (
          <>
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              error={errors.email?.message}
              {...register('email')}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Send Reset Link
            </Button>
          </>
        )}

        <div className="text-center text-sm space-y-2">
          <div>
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Back to Sign In
            </Link>
          </div>
          <div>
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
