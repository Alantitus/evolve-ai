'use client'

import { MessageSquare, Sparkles, LogOut, Trash2, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSessions, createSession, deleteSession } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

interface Session {
  id: string
  title: string
  created_at: string
}

interface SidebarProps {
  onSessionSelect: (sessionId: string) => void
  currentSessionId: string | null
  onSessionDeleted?: (sessionId: string) => void
}

// Helper function to classify dates
function getDateCategory(date: Date): { category: string; sortOrder: number } {
  const now = new Date()
  
  // Create date objects without time to compare only the date
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = today.getTime() - sessionDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return { category: 'Today', sortOrder: 0 }
  } else if (diffDays === 1) {
    return { category: 'Yesterday', sortOrder: 1 }
  } else if (diffDays < 7) {
    return { category: 'This Week', sortOrder: 2 }
  } else if (diffDays < 30) {
    return { category: 'This Month', sortOrder: 3 }
  } else if (diffDays < 365) {
    return { category: 'Earlier This Year', sortOrder: 4 }
  } else {
    return { category: 'Older', sortOrder: 5 }
  }
}

// Helper to group sessions by date category
function groupSessionsByDate(sessions: Session[]) {
  const grouped: { [key: string]: Session[] } = {}
  
  sessions.forEach(session => {
    const date = new Date(session.created_at)
    const { category } = getDateCategory(date)
    
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(session)
  })

  // Sort categories by sortOrder
  const categories = Object.keys(grouped).sort((a, b) => {
    const orderA = getDateCategory(new Date(grouped[a][0].created_at)).sortOrder
    const orderB = getDateCategory(new Date(grouped[b][0].created_at)).sortOrder
    return orderA - orderB
  })

  return { grouped, categories }
}

export default function Sidebar({ onSessionSelect, currentSessionId, onSessionDeleted }: SidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const { user, signOut } = useAuth()

  const loadSessions = useCallback(async () => {
    if (!supabase) {
      console.log('No Supabase, setting empty sessions')
      setSessions([])
      setLoading(false)
      return
    }

    try {
      // Get sessions for current user (authenticated or anonymous)
      console.log('Loading sessions for user:', user?.id)
      const data = await getSessions(user?.id || undefined)
      console.log('Loaded sessions:', data)
      setSessions(data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Periodically refresh sessions to pick up title changes
  useEffect(() => {
    if (!supabase) return

    const interval = setInterval(() => {
      loadSessions()
    }, 3000) // Refresh every 3 seconds

    return () => clearInterval(interval)
  }, [supabase, loadSessions])

  const handleNewSession = async () => {
    console.log('handleNewSession called, currentSessionId:', currentSessionId)
    
    if (!supabase) {
      // Use local storage if no Supabase
      const newSessionId = `session-${Date.now()}`
      console.log('No Supabase, using local session:', newSessionId)
      onSessionSelect(newSessionId)
      return
    }

    // If we don't have a current session, look for an existing empty "New Chat" session
    if (!currentSessionId) {
      const existingEmptySession = sessions.find(s => s.title === 'New Chat')
      
      if (existingEmptySession) {
        // Reuse existing empty session
        console.log('Reusing existing empty session:', existingEmptySession.id)
        onSessionSelect(existingEmptySession.id)
        return
      }
    }

    try {
      const userId = user?.id || null
      console.log('Creating new session for user:', userId)
      const newSession = await createSession(userId, 'New Chat')
      if (newSession) {
        console.log('New session created:', newSession)
        await loadSessions()
        onSessionSelect(newSession.id)
      }
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId)
      await loadSessions()
      setDeleteConfirm(null)
      
      // If we deleted the current session, notify parent
      if (sessionId === currentSessionId) {
        onSessionDeleted?.(sessionId)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete session')
    }
  }

  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent session selection
    setDeleteConfirm(sessionId)
  }

  return (
    <div className="bg-white border-r border-gray-200 flex flex-col w-64 h-full overflow-hidden">
      {/* Logo Section */}
      <div className="p-3 lg:p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="bg-blue-600 text-white rounded-lg w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center font-bold text-base lg:text-lg">
            E
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Evolve AI</h2>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-2 py-4 lg:py-6 flex-shrink-0">
        <button
          onClick={handleNewSession}
          className="w-full flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="text-sm font-medium">New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2">

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No chat history yet</p>
          </div>
        ) : (() => {
          const { grouped, categories } = groupSessionsByDate(sessions)
          return (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {grouped[category].map((session) => (
                      <div
                        key={session.id}
                        className="relative group"
                      >
                        <button
                          onClick={() => onSessionSelect(session.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                            currentSessionId === session.id
                              ? 'bg-purple-100 text-purple-900'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-purple-600' : 'text-gray-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{session.title}</p>
                          </div>
                        </button>
                        {/* Delete button - shown on hover */}
                        <button
                          onClick={(e) => handleDeleteClick(session.id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-100 text-red-600"
                          title="Delete session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* User Info and Logout - Only show if user is authenticated */}
      {user && supabase && (
        <div className="border-t border-gray-200 p-2 space-y-2">
          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email || 'User'}
              </p>
              <p className="text-xs text-gray-500">Free Plan</p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Session</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this chat session? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(deleteConfirm)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

