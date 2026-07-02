import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTokens } from '../hooks/useTokens'
import { supabase } from '../lib/supabase'
import { COUNTRIES } from '../lib/countries'
import { REFERRAL_BONUS } from '../lib/constants'
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

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/register?ref=${profile.referral_code}`
    : ''

  const copyReferral = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startEdit = () => {
    setForm({
      full_name: profile?.full_name || '',
      gender:    profile?.gender || '',
      dob:       profile?.dob || '',
      country:   profile?.country || '',
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
              { label: 'Full Name',      value: profile?.full_name },
              { label: 'Email',          value: user?.email },
              { label: 'Gender',         value: profile?.gender },
              { label: 'Date of Birth',  value: profile?.dob },
              { label: 'Country',        value: profile?.country },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start py-2 border-b border-gray-800/50">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-sm text-white text-right max-w-[60%]">{value || '—'}</span>
              </div>
            ))}
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

        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            Share your link — you earn <span className="text-pink-300 font-semibold">{REFERRAL_BONUS} tokens</span> for every friend who joins!
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 font-mono truncate"
            />
            <button
              onClick={copyReferral}
              className="px-3 py-2 bg-pink-700 hover:bg-pink-600 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button onClick={handleSignOut}
        className="w-full bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50 rounded-xl py-3 text-sm font-semibold transition-colors">
        Sign Out
      </button>
    </div>
  )
}
