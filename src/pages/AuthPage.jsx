import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Wrong email or password. Try again.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-transparent">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🎡</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Spin & SIP Money
          </h1>
          <p className="text-gray-400 text-sm mt-1">Spin. Win. Earn.</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="font-semibold text-center mb-5">Login to your account</h2>
          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors pr-12"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-purple-400 hover:underline">
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 rounded-xl py-3 font-semibold transition-all">
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="text-center text-sm text-gray-500">
              New user?{' '}
              <Link to="/register" className="text-purple-400 hover:underline font-medium">
                Create Account
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
