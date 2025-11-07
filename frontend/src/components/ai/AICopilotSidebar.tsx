'use client'

/**
 * AI Copilot Sidebar - Natural Language Interface
 *
 * Permet aux users d'interroger leurs données en langage naturel
 *
 * Exemples de queries:
 * - "Quels artistes sont trending à Paris ?"
 * - "Compare Drake vs Kendrick streaming last month"
 * - "Show me momentum drop alerts cette semaine"
 * - "Top 10 superfans avec FVS > 90"
 *
 * Pipeline NLP:
 * 1. Query Understanding (Intent Detection) - GPT-4
 * 2. Entity Extraction (Artists, Metrics, Dates, Locations)
 * 3. SQL Generation (Natural language → SQL)
 * 4. Query Execution
 * 5. Response Generation (GPT-4 formats response)
 *
 * REF: FanPulse IA Guide - Use Case #8
 */

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  BarChart3,
  Download,
  Copy,
  ChevronRight,
  Loader2,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  data?: {
    type: 'chart' | 'table' | 'list'
    results?: any[]
    sql?: string
  }
}

interface AICopilotSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function AICopilotSidebar({ isOpen, onClose }: AICopilotSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestedQueries = [
    "Quels artistes sont trending à Paris ?",
    "Compare Drake vs Kendrick streaming last month",
    "Show me momentum drop alerts cette semaine",
    "Top 10 superfans avec FVS > 90",
    "Artists avec fan concentration Berlin",
    "Releases sous-performantes vs forecast"
  ]

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // TODO: Replace with real AI API endpoint
    // POST /api/ai/copilot with { query: input }
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(input),
        timestamp: new Date(),
        data: generateMockData(input)
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const generateMockResponse = (query: string): string => {
    if (query.toLowerCase().includes('trending') && query.toLowerCase().includes('paris')) {
      return `Je cherche les artistes avec momentum élevé et forte concentration fans à Paris...

📊 RÉSULTATS (3 artistes trouvés)

1. 🎤 Maya Rivers
   Momentum : 87/100 (↑ +12 pts cette semaine)
   Paris Fans : 2,340 (18% de l'audience)
   Top City : Paris (#1)

2. 🎤 Alex Laurent
   Momentum : 82/100 (↑ +8 pts cette semaine)
   Paris Fans : 1,890 (22% de l'audience)
   Top City : Paris (#1)

3. 🎤 Sophie Martin
   Momentum : 78/100 (↑ +6 pts cette semaine)
   Paris Fans : 1,560 (15% de l'audience)
   Top City : Paris (#2 après Lyon)

💡 INSIGHTS :
Maya Rivers a le momentum le plus fort et la plus grande fanbase parisienne. Opportunité booking show à Paris dans les 60 prochains jours.`
    }

    if (query.toLowerCase().includes('compare') || query.toLowerCase().includes('vs')) {
      return `Comparaison streaming last month :

📊 DRAKE
Streams : 2.4M (+15% vs previous month)
Top Track : "God's Plan" (450K streams)
Avg Daily : 80K streams
Peak Day : Sunday (120K streams)

📊 KENDRICK LAMAR
Streams : 1.8M (+8% vs previous month)
Top Track : "HUMBLE." (380K streams)
Avg Daily : 60K streams
Peak Day : Friday (95K streams)

📈 ANALYSE :
Drake leads with 33% more streams. However, Kendrick's engagement rate is higher (4.2% vs 3.1% saves rate). Drake peaks on weekends, Kendrick on Fridays (release day effect).`
    }

    if (query.toLowerCase().includes('superfans') || query.toLowerCase().includes('fvs')) {
      return `Top 10 superfans avec FVS > 90 :

🏆 TOP SUPERFANS

1. @julie_music - FVS: 98/100
   Total Streams : 12,500 | Spent : €240
   Location : Paris, France

2. @mark_fan - FVS: 96/100
   Total Streams : 10,800 | Spent : €180
   Location : Lyon, France

3. @sarah_beats - FVS: 94/100
   Total Streams : 9,200 | Spent : €150
   Location : Marseille, France

... (7 more)

💡 RECOMMENDATION :
Ces 10 fans représentent 8% de tes streams et 15% de tes revenus merch. Consider creating a VIP group avec early access et exclusive content.`
    }

    return `J'ai analysé ta requête et voici ce que j'ai trouvé...

${query}

[Résultats génériques - TODO: Connect to real AI]`
  }

  const generateMockData = (query: string) => {
    if (query.toLowerCase().includes('trending')) {
      return {
        type: 'list' as const,
        results: [
          { name: 'Maya Rivers', momentum: 87, fans: 2340 },
          { name: 'Alex Laurent', momentum: 82, fans: 1890 },
          { name: 'Sophie Martin', momentum: 78, fans: 1560 },
        ]
      }
    }
    return undefined
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    // TODO: Show toast notification
  }

  if (!isOpen) return null

  return (
    <div
      className={`
        fixed right-0 top-0 h-screen bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800
        shadow-2xl transition-all duration-300 z-50 flex flex-col
        ${isMinimized ? 'w-16' : 'w-96'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!isMinimized && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">AI Copilot</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pose tes questions</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-6">
                {/* Welcome Message */}
                <div className="text-center pt-8 pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    AI Copilot
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                    Interroge tes données en langage naturel. Je comprends le français et l'anglais.
                  </p>
                </div>

                {/* Suggested Queries */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">
                    Essaie ces queries :
                  </p>
                  <div className="space-y-2">
                    {suggestedQueries.map((query, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(query)}
                        className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {query}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-[85%] rounded-xl p-4
                        ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }
                      `}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                            AI Copilot
                          </span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => handleCopy(message.content)}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                          {message.data && (
                            <button className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              Export CSV
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          AI réfléchit...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pose une question..."
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 Powered by GPT-4 - Natural Language Understanding
            </p>
          </div>
        </>
      )}

      {/* Minimized View */}
      {isMinimized && (
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg hover:scale-110 transition-transform"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
