import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ADMIN_EMAIL, REFERRAL_BONUS } from '../lib/constants'

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 9).toUpperCase()
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password, fullName, gender, dob, country, avatarFile, referralCode }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    if (data.user) {
      // Upload avatar if provided and session exists
      let avatarUrl = null
      if (avatarFile && data.session) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${data.user.id}/avatar.${ext}`
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
          avatarUrl = publicUrl + '?t=' + Date.now()
        }
      }

      const myReferralCode = generateReferralCode()

      // Save profile with own referral code + who referred them
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        full_name: fullName,
        gender,
        dob,
        country,
        referral_code: myReferralCode,
        ...(referralCode ? { referred_by: referralCode.toUpperCase() } : {}),
        ...(avatarUrl   ? { avatar_url: avatarUrl }                     : {}),
      }, { onConflict: 'user_id' })

      await supabase.from('user_tokens').upsert(
        { user_id: data.user.id },
        { onConflict: 'user_id' }
      )

      // Credit referrer if a valid code was used
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('referral_code', referralCode.toUpperCase())
          .neq('user_id', data.user.id)
          .single()

        if (referrer) {
          const { data: refTokens } = await supabase
            .from('user_tokens')
            .select('*')
            .eq('user_id', referrer.user_id)
            .single()

          await supabase.from('user_tokens').upsert({
            user_id:         referrer.user_id,
            referral_tokens: (refTokens?.referral_tokens || 0) + REFERRAL_BONUS,
            total_earned:    (refTokens?.total_earned    || 0) + REFERRAL_BONUS,
            balance:         (refTokens?.balance         || 0) + REFERRAL_BONUS,
            total_purchased: refTokens?.total_purchased || 0,
            total_withdrawn: refTokens?.total_withdrawn || 0,
          }, { onConflict: 'user_id' })

          await supabase.from('transactions').insert({
            user_id: referrer.user_id,
            type:    'referral',
            amount:  REFERRAL_BONUS,
            status:  'completed',
          })
        }
      }
    }
    return data
  }

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const forgotPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const resetPassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const signOut = () => supabase.auth.signOut()
  const isAdmin = user?.email === ADMIN_EMAIL

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signUp, login, forgotPassword, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
