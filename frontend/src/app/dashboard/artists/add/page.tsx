'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Music, Users, ExternalLink, Plus, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  popularity: number
  followers: number
  images: Array<{ url: string; height: number; width: number }>
  external_url: string
}

export default function AddArtistPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/artists/search/spotify', {
        params: { q: searchQuery }
      })
      setSearchResults(response.data)

      if (response.data.length === 0) {
        setError('Aucun artiste trouvé. Essayez une autre recherche.')
      }
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.response?.data?.detail || 'Erreur lors de la recherche')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (spotifyId: string) => {
    setImporting(spotifyId)
    setError(null)

    try {
      await api.post('/artists/import/spotify', {
        spotify_id: spotifyId
      })

      // Redirect to dashboard after successful import
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Import error:', err)
      setError(err.response?.data?.detail || 'Erreur lors de l\'import')
      setImporting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ajouter un artiste
          </h1>
          <p className="text-gray-600">
            Recherchez et importez vos artistes depuis Spotify
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Nom de l'artiste (ex: Drake, Beyoncé...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher sur Spotify
                </>
              )}
            </Button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Résultats de recherche ({searchResults.length})
            </h2>

            <div className="space-y-3">
              {searchResults.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Artist Image */}
                    <div className="flex-shrink-0">
                      {artist.images[0] ? (
                        <img
                          src={artist.images[0].url}
                          alt={artist.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Music className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Artist Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {artist.name}
                          </h3>

                          {/* Genres */}
                          {artist.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {artist.genres.slice(0, 3).map((genre) => (
                                <span
                                  key={genre}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{artist.followers.toLocaleString('fr-FR')} followers</span>
                            </div>
                            <div>
                              <span className="font-medium">Popularité:</span>{' '}
                              <span className="text-green-600 font-semibold">
                                {artist.popularity}/100
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <a
                            href={artist.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                          <Button
                            onClick={() => handleImport(artist.id)}
                            disabled={importing === artist.id}
                            size="sm"
                          >
                            {importing === artist.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                                Import...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Importer
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && searchResults.length === 0 && !error && searchQuery && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              Aucun artiste trouvé pour "{searchQuery}"
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Essayez une autre orthographe ou un autre artiste
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && searchResults.length === 0 && !error && !searchQuery && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Commencez par rechercher un artiste
            </p>
            <p className="text-gray-500 text-sm">
              Entrez le nom d'un artiste dans la barre de recherche ci-dessus
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
