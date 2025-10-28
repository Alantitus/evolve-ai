'use client'

import { useState, useEffect } from 'react'
import { Providers } from '@/components/Providers'
import ChatInterface from '@/components/ChatInterface'
import Sidebar from '@/components/Sidebar'
import Auth from '@/components/Auth'
import { ChatProvider } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Menu } from 'lucide-react'

function MainApp() {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const handleSessionSelect = (sessionId: string) => {
    console.log('Setting current session ID:', sessionId)
    setCurrentSessionId(sessionId)
  }

  useEffect(() => {
    if (!loading && !user) {
      setShowAuth(true)
    }
  }, [user, loading])

  // Test Supabase connection on mount
  useEffect(() => {
    if (supabase) {
      console.log('🔗 Supabase configured, testing connection...')
      import('@/lib/test-supabase').then(({ checkSupabaseStatus }) => {
        checkSupabaseStatus()
      }).catch(err => {
        console.error('Error testing Supabase:', err)
      })
    } else {
      console.log('ℹ️  Supabase not configured - running in localStorage mode')
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Only show auth screen if explicitly triggered and user is not logged in
  // Allow using the app without authentication
  const showAuthScreen = showAuth && !user
  
  if (showAuthScreen) {
    return <Auth />
  }

  return (
    <ChatProvider sessionId={currentSessionId} onCreateSession={handleSessionSelect}>
      <div className="h-screen flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:static
          inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
        `}>
          <Sidebar 
            onSessionSelect={(sessionId) => {
              handleSessionSelect(sessionId)
              setSidebarOpen(false) // Close sidebar on mobile after selection
            }}
            currentSessionId={currentSessionId}
            onSessionDeleted={(sessionId) => {
              // When a session is deleted, create a new one or set to null
              if (sessionId === currentSessionId) {
                setCurrentSessionId(null)
              }
            }}
          />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <main className="flex-1 overflow-hidden">
            <ChatInterface />
          </main>
        </div>
      </div>
    </ChatProvider>
  )
}

export default function Home() {
  return (
    <Providers>
      <MainApp />
    </Providers>
  )
}


