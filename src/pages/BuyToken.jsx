import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { WALLETS } from '../lib/constants'

export default function BuyToken() {
  const { user } = useAuth()
  const [walletType, setWalletType] = useState('TRC20')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const walletAddress = WALLETS[walletType]

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please upload payment proof screenshot'); return }
    setError('')
    setLoading(true)
    try {
      // Upload screenshot to Supabase Storage
      const ext = file.name.split('.').pop()
      const path = `payment-proofs/${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('proofs').upload(path, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(path)

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'buy',
        status: 'pending',
        wallet_type: walletType,
        proof_url: publicUrl,
      })

      setSuccess(true)
      setFile(null)
      setPreview(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-64 gap-4 text-center mt-10">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-green-400">Payment Proof Submitted!</h2>
        <p className="text-gray-400 text-sm">Admin will verify and add tokens to your account.</p>
        <div className="bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 rounded-xl px-4 py-2 text-sm">
          Status: Pending Confirmation
        </div>
        <button onClick={() => setSuccess(false)} className="text-sm text-purple-400 mt-2">Submit Another</button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5 pb-4 mt-2">
      <h1 className="text-xl font-bold">Buy Tokens</h1>

      {/* Wallet selector */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Select Network</label>
          <div className="flex gap-3">
            {['TRC20', 'BEP20'].map(type => (
              <button
                key={type}
                onClick={() => setWalletType(type)}
                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
                  walletType === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Send payment to this wallet</label>
          <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-2">
            <span className="flex-1 text-xs text-green-400 break-all font-mono">{walletAddress}</span>
            <button onClick={handleCopy} className="text-xs text-purple-400 whitespace-nowrap">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
        <h2 className="font-semibold">Upload Payment Proof</h2>
        <p className="text-xs text-gray-400">After paying, take a screenshot and upload it here.</p>

        <label className={`block border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          preview ? 'border-purple-500' : 'border-gray-700 hover:border-gray-500'
        }`}>
          {preview ? (
            <img src={preview} alt="proof" className="max-h-48 mx-auto rounded-lg object-contain" />
          ) : (
            <div className="py-6">
              <div className="text-3xl mb-2">📸</div>
              <p className="text-sm text-gray-400">Tap to select screenshot</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 rounded-xl py-3 font-semibold transition-all"
        >
          {loading ? 'Uploading...' : 'I Have Paid – Submit Proof'}
        </button>
      </form>
    </div>
  )
}
