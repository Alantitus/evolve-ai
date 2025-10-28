

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create supabase client only if credentials are provided
// This allows the app to work without Supabase
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

// Helper to get current user
export async function getCurrentUser() {
  if (!supabase) {
    return { user: null, error: new Error('Supabase is not configured') }
  }
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Helper to get current session
export async function getCurrentSession() {
  if (!supabase) {
    return { session: null, error: new Error('Supabase is not configured') }
  }
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// Session types
export interface Session {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  messages?: any[]
  slides?: any[]
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Slide {
  id: string
  session_id: string
  title: string
  content: string[]
  order: number
}

// Helper to get or create user identifier
export async function getUserIdentifier(): Promise<string> {
  if (!supabase) {
    // Use a stored identifier from localStorage
    let identifier = localStorage.getItem('ppt-ai-user-id')
    if (!identifier) {
      identifier = `guest-${Date.now()}`
      localStorage.setItem('ppt-ai-user-id', identifier)
    }
    return identifier
  }

  // Try to get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    return user.id
  }

  // Use anonymous identifier
  let identifier = localStorage.getItem('ppt-ai-anonymous-id')
  if (!identifier) {
    identifier = `anonymous-${Date.now()}`
    localStorage.setItem('ppt-ai-anonymous-id', identifier)
  }
  return identifier
}

// Session operations
export async function getSessions(userId?: string) {
  if (!supabase) return []
  
  const identifier = userId || await getUserIdentifier()
  console.log('getSessions: Looking for sessions with identifier:', identifier)
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', identifier)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('getSessions error:', error)
    throw error
  }
  
  console.log('getSessions: Found', data?.length || 0, 'sessions')
  return data
}

export async function createSession(userId: string | null, title: string) {
  if (!supabase) return null
  
  const identifier = userId || await getUserIdentifier()
  
  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: identifier, title })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSession(sessionId: string, updates: any) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSession(sessionId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (error) throw error
}

// Message operations
export async function saveMessages(sessionId: string, messages: any[]) {
  if (!supabase) return []
  // Delete existing messages
  await supabase.from('messages').delete().eq('session_id', sessionId)

  // Insert new messages
  const { data, error } = await supabase
    .from('messages')
    .insert(messages.map(msg => ({
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
      created_at: msg.timestamp.toISOString()
    })))

  if (error) throw error
  return data
}

export async function getMessages(sessionId: string) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

// Slide operations
export async function saveSlides(sessionId: string, slides: any[]) {
  if (!supabase) return []
  // Delete existing slides
  await supabase.from('slides').delete().eq('session_id', sessionId)

  // Insert new slides
  const { data, error } = await supabase
    .from('slides')
    .insert(slides.map((slide, index) => ({
      session_id: sessionId,
      title: slide.title,
      content: slide.content,
      order_index: index
    })))

  if (error) throw error
  return data
}

export async function getSlides(sessionId: string) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('slides')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data
}

