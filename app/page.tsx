'use client'

import { useState, useEffect } from 'react'
import { Providers } from '@/components/Providers'
import ChatInterface from '@/components/ChatInterface'
import Sidebar from '@/components/Sidebar'
import Auth from '@/components/Auth'
import { ChatProvider } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

function MainApp() {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  
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
        {/* Sidebar - Hidden on mobile, only shows on desktop */}
        <div className="hidden lg:flex">
            <Sidebar 
              onSessionSelect={handleSessionSelect}
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


