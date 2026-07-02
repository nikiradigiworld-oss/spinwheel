import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTokens } from '../hooks/useTokens'
import { supabase } from '../lib/supabase'
import { COUNTRIES } from '../lib/countries'
import { REFERRAL_BONUS, REFERRAL_PURCHASE_BONUS, REFERRAL_PURCHASE_THRESHOLD } from '../lib/constants'
import Avatar from '../components/Avatar'

const STAT_CARDS = [
  { key: 'total_purchased', label: 'Purchased', icon: '🛒', color: 'text-indigo-400' },
  { key: 'total_earned',    label: 'Earned',    icon: '🎡', color: 'text-purple-400' },
  { key: 'referral_tokens', label: 'Reference', icon: '🤝', color: 'text-pink-400'   },
  { key: 'balance',         label: 'Available', icon: '💎', color: 'text-green-400'  },
  { key: 'total_withdrawn', label: 'Withdrawn', icon: '💸', color: 'text-orange-400' },
]

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { profile, loading, updateProfile, uploadAvatar } = useProfile()
  const { tokens } = useTokens()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [referralCount, setReferralCount] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!profile?.referral_code) return
    supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('referred_by', profile.referral_code)
      .then(({ count }) => setReferralCount(count || 0))
  }, [profile?.referral_code])

  const copyReferral = async () => {
    if (!profile?.referral_code) return
    await navigator.clipboard.writeText(profile.referral_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startEdit = () => {
    setForm({
      full_name:       profile?.full_name || '',
      gender:          profile?.gender || '',
      dob:             profile?.dob || '',
      country:         profile?.country || '',
      github_username: profile?.github_username || '',
    })
    setEditing(true)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!form.full_name) { setError('Name is required'); return }
    setError('')
    setSaving(true)
    try {
      await updateProfile(form)
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadAvatar(file)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  if (loading) return (
    <div className="flex justify-center mt-20">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'

  return (
    <div className="space-y-4 pb-6 mt-2">
      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/80 rounded-2xl border border-gray-800 p-5 flex flex-col items-center gap-3 text-center">

        {/* Avatar with upload */}
        <div className="relative">
          <Avatar src={profile?.avatar_url} name={displayName} size="xl" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-sm shadow-lg transition-colors"
          >
            {uploading ? '⏳' : '📷'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div>
          <h2 className="text-xl font-bold">{displayName}</h2>
          <p className="text-sm text-gray-400">{user?.email}</p>
          {profile?.country && <p className="text-xs text-gray-500 mt-0.5">🌍 {profile.country}</p>}
          {profile?.github_username && (
            <a
              href={`https://github.com/${profile.github_username}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-300 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.604-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.625-5.479 5.92.43.372.823 1.102.823 2.222 0 1.604-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              @{profile.github_username}
            </a>
          )}
        </div>

        {saved && <p className="text-xs text-green-400">✅ Profile updated!</p>}
      </motion.div>

      {/* Token stats */}
      <div className="grid grid-cols-2 gap-2">
        {STAT_CARDS.map(({ key, label, icon, color }) => (
          <div key={key} className="bg-gray-900/80 border border-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{icon}</span>
              <span className={`text-xs font-medium ${color}`}>{label}</span>
            </div>
            <p className="text-xl font-bold">{tokens?.[key] ?? 0}</p>
            <p className="text-xs text-gray-500">tokens</p>
          </div>
        ))}
      </div>

      {/* Profile details */}
      <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Account Details</h3>
          {!editing && (
            <button onClick={startEdit}
              className="text-xs text-purple-400 border border-purple-500/30 px-3 py-1 rounded-lg hover:bg-purple-500/10 transition-colors">
              ✏️ Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-3">
            {[
              { label: 'Full Name',     value: profile?.full_name },
              { label: 'Email',         value: user?.email },
              { label: 'Gender',        value: profile?.gender },
              { label: 'Date of Birth', value: profile?.dob },
              { label: 'Country',       value: profile?.country },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start py-2 border-b border-gray-800/50">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-sm text-white text-right max-w-[60%]">{value || '—'}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-gray-500">GitHub</span>
              {profile?.github_username ? (
                <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-400 hover:underline">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.604-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.625-5.479 5.92.43.372.823 1.102.823 2.222 0 1.604-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  @{profile.github_username}
                </a>
              ) : (
                <span className="text-sm text-gray-600">—</span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500">
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Country</label>
              <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500">
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">GitHub Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input
                  type="text"
                  value={form.github_username}
                  onChange={e => setForm(f => ({ ...f, github_username: e.target.value.replace(/^@/, '') }))}
                  placeholder="your-github-username"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-50 rounded-xl py-2.5 text-sm font-semibold">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 bg-gray-800 rounded-xl text-sm text-gray-400 hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Referral section */}
      <div className="bg-gray-900/80 rounded-2xl border border-pink-500/20 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤝</span>
          <h3 className="font-semibold">Refer &amp; Earn</h3>
        </div>

        <div className="bg-pink-900/20 border border-pink-500/20 rounded-xl p-3 text-center space-y-1">
          <p className="text-xs text-gray-400">Your Referral Code</p>
          <p className="text-2xl font-black tracking-widest text-pink-300 font-mono">
            {profile?.referral_code || '—'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="bg-gray-800 rounded-xl py-3">
            <p className="text-xl font-bold text-pink-400">{referralCount}</p>
            <p className="text-xs text-gray-500">Friends Joined</p>
          </div>
          <div className="bg-gray-800 rounded-xl py-3">
            <p className="text-xl font-bold text-pink-400">{tokens?.referral_tokens ?? 0}</p>
            <p className="text-xs text-gray-500">Tokens Earned</p>
          </div>
        </div>

        {/* Reward info */}
        <div className="bg-gray-800/60 border border-pink-500/10 rounded-xl p-3 space-y-2">
          <p className="text-xs text-pink-300 font-semibold uppercase tracking-wide">🎁 How You Earn</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-600/20 border border-pink-500/30 flex items-center justify-center shrink-0">
                <span className="text-sm">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium">Friend signs up with your code</p>
                <p className="text-xs text-gray-400">You instantly get</p>
              </div>
              <p className="text-base font-black text-pink-400 shrink-0">+{REFERRAL_BONUS} 🪙</p>
            </div>
            <div className="border-t border-gray-700/50" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-600/20 border border-yellow-500/30 flex items-center justify-center shrink-0">
                <span className="text-sm">💳</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium">Friend purchases {REFERRAL_PURCHASE_THRESHOLD} tokens</p>
                <p className="text-xs text-gray-400">Bonus credited to you <span className="text-yellow-400 font-semibold">{REFERRAL_PURCHASE_BONUS} tokens</span></p>
              </div>
              <p className="text-base font-black text-yellow-400 shrink-0">+{REFERRAL_PURCHASE_BONUS} 🪙</p>
            </div>
          </div>
        </div>

        <button
          onClick={copyReferral}
          className="w-full px-3 py-2 bg-pink-700 hover:bg-pink-600 rounded-xl text-sm font-semibold transition-colors"
        >
          {copied ? '✅ Code Copied!' : '📋 Copy Referral Code'}
        </button>
      </div>

      {/* Sign out */}
      <button onClick={handleSignOut}
        className="w-full bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50 rounded-xl py-3 text-sm font-semibold transition-colors">
        Sign Out
      </button>
    </div>
  )
}
