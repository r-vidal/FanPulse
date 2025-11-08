import { ReactNode } from 'react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">🎵 FanPulse</h1>
          </Link>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Music Analytics for Managers
          </p>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-lg rounded-lg border border-transparent dark:border-gray-800">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
