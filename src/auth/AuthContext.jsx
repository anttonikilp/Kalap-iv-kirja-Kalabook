import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: kuuntelija } = supabase.auth.onAuthStateChange((_tapahtuma, uusiSessio) => {
      setSession(uusiSessio)
    })

    return () => kuuntelija.subscription.unsubscribe()
  }, [])

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const konteksti = useContext(AuthContext)
  if (konteksti === undefined) {
    throw new Error('useAuth on kaytettava AuthProviderin sisalla')
  }
  return konteksti
}
