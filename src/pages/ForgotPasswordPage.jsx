import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(
        err.message?.toLowerCase().includes('rate limit')
          ? 'Too many emails sent. Please wait 1 hour or contact support.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-transparent">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔐</div>
          <h1 className="text-xl font-bold text-white">Forgot Password</h1>
          <p className="text-gray-400 text-sm mt-1">We'll send a reset link to your Gmail</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email / Gmail Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 rounded-xl py-3 font-semibold transition-all">
                {loading ? 'Sending...' : 'Send Reset Link to Gmail'}
              </button>

              <Link to="/auth" className="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors">
                ← Back to Login
              </Link>
            </form>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4">
              <div className="text-5xl">📩</div>
              <h2 className="font-bold text-lg text-green-400">Reset Link Sent!</h2>
              <p className="text-gray-400 text-sm">Password reset email sent to</p>
              <p className="text-white font-semibold">{email}</p>
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-300 space-y-2">
                <p>✉️ Open your <strong>Gmail</strong> inbox</p>
                <p>🔗 Click the <strong>"Reset Password"</strong> link</p>
                <p>🔑 Set your new password</p>
              </div>
              <p className="text-xs text-gray-500">Check Spam / Promotions folder if not in inbox.</p>
              <Link to="/auth" className="block text-sm text-purple-400 hover:underline">
                Back to Login
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
