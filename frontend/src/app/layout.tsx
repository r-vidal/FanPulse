import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ToastProvider } from '@/contexts/ToastContext'
import { ToastContainer } from '@/components/ui/Toast'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'FanPulse - Music Analytics for Managers',
  description: 'Transform streaming data into actionable growth strategies using predictive analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
