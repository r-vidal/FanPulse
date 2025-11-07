import { ArtistProvider } from '@/contexts/ArtistContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import { ReactNode } from 'react'

export default function DashboardRootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <SubscriptionProvider>
      <ArtistProvider>{children}</ArtistProvider>
    </SubscriptionProvider>
  )
}
