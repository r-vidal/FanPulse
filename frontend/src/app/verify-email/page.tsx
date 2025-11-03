'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyEmail } from '@/lib/auth'
import AuthLayout from '@/components/auth/AuthLayout'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError('Invalid or missing verification token.')
        setIsVerifying(false)
        return
      }

      try {
        await verifyEmail(token)
        setSuccess(true)

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } catch (err: any) {
        console.error('Verification error:', err)
        setError(
          err.response?.data?.detail || 'Failed to verify email. The link may have expired.'
        )
      } finally {
        setIsVerifying(false)
      }
    }

    verify()
  }, [token, router])

  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Verifying your email address"
    >
      <div className="space-y-6">
        {isVerifying && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Verifying your email...</p>
          </div>
        )}

        {error && (
          <>
            <Alert type="error" title="Verification Failed">
              {error}
            </Alert>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Need a new verification link?
              </p>
              <Link
                href="/resend-verification"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Resend verification email
              </Link>
            </div>
          </>
        )}

        {success && (
          <>
            <Alert type="success" title="Email Verified!">
              Your email has been successfully verified. You can now sign in to your account.
              Redirecting to login...
            </Alert>
          </>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
