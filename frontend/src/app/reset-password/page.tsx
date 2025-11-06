'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations/auth'
import { resetPassword } from '@/lib/auth'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.')
    }
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return

    try {
      setError(null)
      await resetPassword(token, data.password)
      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(
        err.response?.data?.detail || 'Failed to reset password. The link may have expired.'
      )
    }
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your new password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert type="error" title="Error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert type="success" title="Success!">
            Your password has been reset successfully. Redirecting to login...
          </Alert>
        )}

        {token && !success && (
          <>
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              helperText="At least 8 characters with uppercase, lowercase, and number"
              {...register('password')}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Reset Password
            </Button>
          </>
        )}

        <div className="text-center text-sm">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Reset Password" subtitle="Loading...">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
