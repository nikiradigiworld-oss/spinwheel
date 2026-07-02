import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTokens() {
  const { user } = useAuth()
  const [tokens, setTokens] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setTokens(data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  return { tokens, loading, refetch: fetch }
}
