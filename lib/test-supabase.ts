'use client'

import { supabase } from './supabase'

export async function testSupabaseConnection() {
  const results = {
    supabaseConfigured: false,
    connected: false,
    authenticated: false,
    tablesExist: false,
    error: null as string | null,
    details: {} as any
  }

  try {
    // Check if Supabase is configured
    results.supabaseConfigured = supabase !== null

    if (!supabase) {
      results.error = 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
      return results
    }

    // Test basic connection
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      results.connected = true
      results.authenticated = !!session
      results.details.session = session ? 'User is authenticated' : 'No active session'
    } catch (error: any) {
      results.error = `Connection error: ${error.message}`
      return results
    }

    // Test if tables exist
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('count')
        .limit(1)

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means table doesn't exist
        throw error
      }

      results.tablesExist = !error
      results.details.tables = error 
        ? 'Tables do not exist - run SQL commands from SUPABASE_SETUP.md'
        : 'Tables exist and are accessible'
    } catch (error: any) {
      results.error = `Table check failed: ${error.message}`
      results.details.tableError = error
    }

  } catch (error: any) {
    results.error = error.message
  }

  return results
}

export async function checkSupabaseStatus() {
  console.log('🔍 Checking Supabase connection...\n')
  
  const results = await testSupabaseConnection()
  
  console.log('📊 Connection Results:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Supabase Configured: ${results.supabaseConfigured ? 'Yes' : 'No'}`)
  console.log(`✅ Connected: ${results.connected ? 'Yes' : 'No'}`)
  console.log(`✅ Authenticated: ${results.authenticated ? 'Yes' : 'No'}`)
  console.log(`✅ Tables Accessible: ${results.tablesExist ? 'Yes' : 'No'}`)
  
  if (results.error) {
    console.log(`❌ Error: ${results.error}`)
  }
  
  if (results.details) {
    console.log('\n📝 Details:')
    Object.entries(results.details).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`)
    })
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  return results
}

