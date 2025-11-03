import { useEffect, useRef, useState, useCallback } from 'react'
import type { Opportunity } from '@/types'

interface WebSocketMessage {
  type: 'alert' | 'notification' | 'heartbeat' | 'initial_opportunities' | 'opportunities_refreshed' | 'pong'
  timestamp?: string
  data?: any
  opportunities?: Opportunity[]
  count?: number
}

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [latestAlert, setLatestAlert] = useState<Opportunity | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No auth token found')
      return
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000'
    const wsUrl = `${wsProtocol}//${wsHost}/api/ws/alerts?token=${token}`

    try {
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          switch (message.type) {
            case 'initial_opportunities':
              if (message.opportunities) {
                setOpportunities(message.opportunities)
              }
              break

            case 'alert':
              if (message.data) {
                setLatestAlert(message.data)
                setOpportunities((prev) => [message.data, ...prev])
              }
              break

            case 'opportunities_refreshed':
              if (message.opportunities) {
                setOpportunities(message.opportunities)
              }
              break

            case 'heartbeat':
            case 'pong':
              // Keep-alive messages
              break

            default:
              console.log('Unknown message type:', message.type)
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)

        // Attempt to reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect...')
          connect()
        }, 5000)
      }
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
    }
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    setIsConnected(false)
  }, [])

  const refreshOpportunities = useCallback(() => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify({ type: 'refresh_opportunities' }))
    }
  }, [isConnected])

  const ping = useCallback(() => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify({ type: 'ping' }))
    }
  }, [isConnected])

  useEffect(() => {
    connect()

    // Ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(ping, 30000)

    return () => {
      clearInterval(pingInterval)
      disconnect()
    }
  }, [connect, disconnect, ping])

  return {
    isConnected,
    opportunities,
    latestAlert,
    refreshOpportunities,
    clearLatestAlert: () => setLatestAlert(null),
  }
}
