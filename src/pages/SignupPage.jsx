import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { COUNTRIES } from '../lib/countries'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', gender: '', dob: '', country: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const avatarRef = useRef()

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { fullName, email, password, confirmPassword, gender, dob, country } = form
    if (!fullName || !email || !password || !gender || !dob || !country) {
      setError('Please fill all fields'); return
    }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)
    try {
      await signUp({ email, password, fullName, gender, dob, country, avatarFile })
      setSuccess(true)
    } catch (err) {
      setError(
        err.message?.toLowerCase().includes('rate limit')
          ? 'Too many emails sent. Please wait 1 hour or ask admin to set up Gmail SMTP.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900 rounded-2xl p-8 border border-gray-800 max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">📧</div>
          <h2 className="text-xl font-bold text-green-400">Account Created!</h2>
          <p className="text-gray-400 text-sm">
            A confirmation email has been sent to <span className="text-white font-semibold">{form.email}</span>.
          </p>
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 text-sm text-purple-300">
            Check your Gmail inbox and click <strong>"Confirm your email"</strong> to activate your account.
          </div>
          <p className="text-xs text-gray-500">Check Spam / Promotions folder if not in inbox.</p>
          <Link to="/auth"
            className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl py-3 font-semibold text-center transition-all">
            Go to Login
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-transparent">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🎡</div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-gray-400 text-xs mt-1">Spin. Win. Earn.</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-3">

          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-500/50" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/40 to-blue-600/40 border-2 border-dashed border-purple-500/40 flex items-center justify-center text-3xl">
                  👤
                </div>
              )}
              <button type="button" onClick={() => avatarRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-xs shadow-lg transition-colors">
                📷
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
            </div>
            <p className="text-xs text-gray-500">Profile photo (optional)</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Full Name *</label>
            <input type="text" required value={form.fullName} onChange={e => set('fullName', e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email Address *</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="Enter your Gmail / email"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Password *</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required value={form.password}
                onChange={e => set('password', e.target.value)} placeholder="Min 6 characters"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 pr-10" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Confirm Password *</label>
            <input type="password" required value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter password"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Gender *</label>
            <select value={form.gender} onChange={e => set('gender', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500">
              <option value="">Select gender</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Date of Birth *</label>
            <input type="date" required value={form.dob} onChange={e => set('dob', e.target.value)}
              max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            <p className="text-xs text-gray-500 mt-0.5">Must be 18 or older</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Country *</label>
            <select value={form.country} onChange={e => set('country', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500">
              <option value="">Select your country</option>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {error && <p className="text-red-400 text-xs bg-red-900/20 rounded-lg p-2">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 rounded-xl py-3 font-semibold text-sm transition-all mt-1">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/auth" className="text-purple-400 hover:underline">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
