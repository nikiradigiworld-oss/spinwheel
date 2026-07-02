import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setProfile(data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const updateProfile = async (updates) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
    if (error) throw error
    await fetch()
  }

  const uploadAvatar = async (file) => {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await updateProfile({ avatar_url: publicUrl + '?t=' + Date.now() })
    return publicUrl
  }

  return { profile, loading, updateProfile, uploadAvatar, refetch: fetch }
}
