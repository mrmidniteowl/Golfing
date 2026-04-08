import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured as isConfigured } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isDemo: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const DEMO_PROFILE: Profile = {
  id: 'demo-user',
  email: 'demo@golftracker.app',
  full_name: 'Demo Player',
  avatar_url: null,
  role: 'commissioner',
  created_at: new Date().toISOString(),
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    if (!isConfigured) {
      // No Supabase configured - check for demo mode
      const demoActive = localStorage.getItem('golf_demo_mode')
      if (demoActive === 'true') {
        setUser({ id: 'demo-user', email: 'demo@golftracker.app' } as User)
        setProfile(DEMO_PROFILE)
        setIsDemo(true)
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) fetchProfile(s.user.id)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) fetchProfile(s.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isConfigured) {
      return { error: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.' }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        avatar_url: null,
        role: 'player',
      })
      await fetchProfile(data.user.id)
    }
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem('golf_demo_mode')
      setUser(null)
      setProfile(null)
      setIsDemo(false)
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (isDemo) {
      setProfile((p) => p ? { ...p, ...updates } : p)
      return
    }
    if (!user) return
    await supabase.from('profiles').update(updates as Record<string, unknown>).eq('id', user.id)
    await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, isDemo, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
