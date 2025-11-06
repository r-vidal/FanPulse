'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type ToastPriority = 'critical' | 'high' | 'low'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
  priority?: ToastPriority
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, options?: ToastOptions) => void
  removeToast: (id: string) => void
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  critical: (message: string, options?: Omit<ToastOptions, 'priority'>) => void
}

interface ToastOptions {
  duration?: number
  priority?: ToastPriority
  action?: {
    label: string
    onClick: () => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (type: ToastType, message: string, options: ToastOptions = {}) => {
      const id = Math.random().toString(36).substr(2, 9)
      const priority = options.priority || 'low'

      // Default durations based on priority
      let duration = options.duration
      if (!duration) {
        switch (priority) {
          case 'critical':
            duration = 0 // Must be dismissed manually
            break
          case 'high':
            duration = 8000 // 8 seconds
            break
          case 'low':
            duration = 4000 // 4 seconds
            break
        }
      }

      const toast: Toast = {
        id,
        type,
        message,
        duration,
        priority,
        action: options.action,
      }

      setToasts((prev) => {
        // Critical toasts go to the top
        if (priority === 'critical') {
          return [toast, ...prev]
        }
        // Others go to the bottom
        return [...prev, toast]
      })

      // Auto-remove after duration (if duration > 0)
      if (duration && duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast('success', message, options)
    },
    [addToast]
  )

  const error = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast('error', message, options)
    },
    [addToast]
  )

  const info = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast('info', message, options)
    },
    [addToast]
  )

  const warning = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast('warning', message, options)
    },
    [addToast]
  )

  const critical = useCallback(
    (message: string, options?: Omit<ToastOptions, 'priority'>) => {
      addToast('error', message, { ...options, priority: 'critical' })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning, critical }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
