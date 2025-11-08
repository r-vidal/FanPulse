import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {props.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors',
            'text-gray-900 bg-white dark:text-white dark:bg-gray-800',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            error
              ? 'border-red-300 focus:ring-red-500 dark:border-red-700 dark:focus:ring-red-400'
              : 'border-gray-300 dark:border-gray-600',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:bg-gray-900 dark:disabled:text-gray-600',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
