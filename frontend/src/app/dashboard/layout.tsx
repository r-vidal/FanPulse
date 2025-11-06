import { ArtistProvider } from '@/contexts/ArtistContext'
import { ReactNode } from 'react'

export default function DashboardRootLayout({
  children,
}: {
  children: ReactNode
}) {
  return <ArtistProvider>{children}</ArtistProvider>
}
