import { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

export interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: ReactNode
  className?: string
}

const Alert = ({ type = 'info', title, children, className }: AlertProps) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  }

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
  }

  const iconColors = {
    success: 'text-green-500 dark:text-green-400',
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    info: 'text-blue-500 dark:text-blue-400',
  }

  return (
    <div className={cn('border rounded-lg p-4', styles[type], className)}>
      <div className="flex items-start">
        <div className={cn('flex-shrink-0', iconColors[type])}>
          {icons[type]}
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-semibold mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default Alert
