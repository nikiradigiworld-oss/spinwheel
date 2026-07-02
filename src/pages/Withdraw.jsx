import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTokens } from '../hooks/useTokens'
import { supabase } from '../lib/supabase'
import { MIN_WITHDRAW_TOKENS, TDS_PERCENT } from '../lib/constants'

export default function Withdraw() {
  const { user } = useAuth()
  const { tokens, refetch } = useTokens()
  const [walletType, setWalletType] = useState('TRC20')
  const [walletAddress, setWalletAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const balance = tokens?.balance ?? 0
  const tds = Math.floor(balance * TDS_PERCENT / 100)
  const afterTds = balance - tds

  const canWithdraw = balance >= MIN_WITHDRAW_TOKENS

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canWithdraw) return
    if (!walletAddress.trim()) { setError('Enter your wallet address'); return }
    setError('')
    setLoading(true)
    try {
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'withdraw',
        amount: balance,
        status: 'pending',
        wallet_type: walletType,
        wallet_address: walletAddress.trim(),
      })

      await supabase.from('user_tokens').upsert({
        user_id: user.id,
        total_withdrawn: (tokens?.total_withdrawn || 0) + balance,
        balance: 0,
      }, { onConflict: 'user_id' })

      refetch()
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-64 gap-4 text-center mt-10">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-green-400">Withdrawal Requested!</h2>
        <p className="text-gray-400 text-sm">Your request is being processed. Usually within 24-48 hours.</p>
        <div className="bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 rounded-xl px-4 py-2 text-sm">
          Status: Processing
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5 pb-4 mt-2">
      <h1 className="text-xl font-bold">Withdraw Tokens</h1>

      {/* Balance summary */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Available Balance</span>
          <span className="font-bold text-white">{balance} tokens</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">TDS Deduction (1%)</span>
          <span className="text-red-400">-{tds} tokens</span>
        </div>
        <div className="h-px bg-gray-800" />
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">You Receive</span>
          <span className="font-bold text-green-400 text-lg">{afterTds} tokens</span>
        </div>
      </div>

      {!canWithdraw && (
        <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-4 text-sm text-orange-300 text-center">
          Minimum {MIN_WITHDRAW_TOKENS} tokens required. You have {balance}.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Network</label>
          <div className="flex gap-3">
            {['TRC20', 'BEP20'].map(type => (
              <button key={type} type="button" onClick={() => setWalletType(type)}
                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
                  walletType === type ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Your {walletType} Wallet Address</label>
          <input
            type="text"
            value={walletAddress}
            onChange={e => setWalletAddress(e.target.value)}
            placeholder={`Enter your ${walletType} address`}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!canWithdraw || loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 font-semibold transition-all"
        >
          {loading ? 'Submitting...' : 'Request Withdrawal'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          1% TDS will be deducted as per government regulations. Manual processing within 24-48h.
        </p>
      </form>
    </div>
  )
}
