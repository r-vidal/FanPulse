'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'

interface Artist {
  id: string
  name: string
  image_url: string | null
  spotify_id?: string
}

interface ArtistContextType {
  selectedArtist: Artist | null
  artists: Artist[]
  loading: boolean
  error: string | null
  setSelectedArtist: (artist: Artist | null) => void
  refreshArtists: () => Promise<void>
  isAllArtists: boolean
}

const ArtistContext = createContext<ArtistContextType | undefined>(undefined)

export function ArtistProvider({ children }: { children: ReactNode }) {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadArtists = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/api/artists/')
      const artistsList: Artist[] = response.data
      setArtists(artistsList)

      // Auto-select first artist if none selected and artists exist
      if (!selectedArtist && artistsList.length > 0) {
        // Check localStorage for previously selected artist
        const savedArtistId = localStorage.getItem('selectedArtistId')
        if (savedArtistId) {
          const savedArtist = artistsList.find(a => a.id === savedArtistId)
          if (savedArtist) {
            setSelectedArtist(savedArtist)
          } else {
            setSelectedArtist(artistsList[0])
          }
        } else {
          setSelectedArtist(artistsList[0])
        }
      }
    } catch (err: any) {
      console.error('Failed to load artists:', err)
      setError(err.response?.data?.detail || 'Failed to load artists')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArtists()
  }, [])

  const handleSetSelectedArtist = (artist: Artist | null) => {
    setSelectedArtist(artist)
    // Save to localStorage
    if (artist) {
      localStorage.setItem('selectedArtistId', artist.id)
    } else {
      localStorage.removeItem('selectedArtistId')
    }
  }

  const value: ArtistContextType = {
    selectedArtist,
    artists,
    loading,
    error,
    setSelectedArtist: handleSetSelectedArtist,
    refreshArtists: loadArtists,
    isAllArtists: selectedArtist === null,
  }

  return <ArtistContext.Provider value={value}>{children}</ArtistContext.Provider>
}

export function useArtistContext() {
  const context = useContext(ArtistContext)
  if (context === undefined) {
    throw new Error('useArtistContext must be used within an ArtistProvider')
  }
  return context
}
