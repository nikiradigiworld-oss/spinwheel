import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function Section({ title, children }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 font-semibold text-sm">{title}</div>
      <div className="divide-y divide-gray-800">{children}</div>
    </div>
  )
}

export default function AdminPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const load = useCallback(async () => {
    const [{ data: p }, { data: w }] = await Promise.all([
      supabase.from('transactions').select('*').eq('type', 'buy').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('type', 'withdraw').eq('status', 'pending').order('created_at', { ascending: false }),
    ])
    setPayments(p || [])
    setWithdrawals(w || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const approvePayment = async (tx, tokenAmount) => {
    const key = `approve-${tx.id}`
    setActionLoading(key)
    try {
      const amount = parseInt(tokenAmount, 10)
      if (!amount || amount <= 0) return

      // Get current tokens
      const { data: tokenRow } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', tx.user_id)
        .single()

      await Promise.all([
        supabase.from('transactions').update({ status: 'completed', amount }).eq('id', tx.id),
        supabase.from('user_tokens').upsert({
          user_id: tx.user_id,
          total_purchased: (tokenRow?.total_purchased || 0) + amount,
          total_earned: (tokenRow?.total_earned || 0) + amount,
          balance: (tokenRow?.balance || 0) + amount,
          total_withdrawn: tokenRow?.total_withdrawn || 0,
          last_spin_date: tokenRow?.last_spin_date || null,
        }, { onConflict: 'user_id' }),
      ])
      load()
    } finally {
      setActionLoading(null)
    }
  }

  const rejectPayment = async (id) => {
    setActionLoading(`reject-${id}`)
    await supabase.from('transactions').update({ status: 'rejected' }).eq('id', id)
    load()
    setActionLoading(null)
  }

  const markWithdrawalPaid = async (id) => {
    setActionLoading(`paid-${id}`)
    await supabase.from('transactions').update({ status: 'completed' }).eq('id', id)
    load()
    setActionLoading(null)
  }

  const handleSignOut = async () => { await signOut(); navigate('/auth') }

  if (loading) return (
    <div className="flex justify-center mt-20">
      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 p-4 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-xl font-bold text-yellow-400">Admin Panel</h1>
          <p className="text-xs text-gray-500">Admin Dashboard</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg">App</button>
          <button onClick={handleSignOut} className="text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg">Logout</button>
        </div>
      </div>

      {/* Pending payments */}
      <Section title={`Pending Payments (${payments.length})`}>
        {payments.length === 0 && <p className="text-gray-500 text-sm p-4">No pending payments.</p>}
        {payments.map(tx => (
          <AdminPaymentRow
            key={tx.id}
            tx={tx}
            onApprove={(amount) => approvePayment(tx, amount)}
            onReject={() => rejectPayment(tx.id)}
            actionLoading={actionLoading}
          />
        ))}
      </Section>

      {/* Pending withdrawals */}
      <Section title={`Pending Withdrawals (${withdrawals.length})`}>
        {withdrawals.length === 0 && <p className="text-gray-500 text-sm p-4">No pending withdrawals.</p>}
        {withdrawals.map(tx => (
          <div key={tx.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{tx.user_id.slice(0, 8)}…</p>
                <p className="text-xs text-gray-400">{tx.wallet_type}: <span className="font-mono text-gray-300 break-all">{tx.wallet_address}</span></p>
                <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-orange-400">{tx.amount} tokens</p>
              </div>
            </div>
            <button
              onClick={() => markWithdrawalPaid(tx.id)}
              disabled={actionLoading === `paid-${tx.id}`}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm py-2 rounded-xl transition-colors"
            >
              {actionLoading === `paid-${tx.id}` ? 'Processing…' : 'Mark as Paid'}
            </button>
          </div>
        ))}
      </Section>
    </div>
  )
}

function AdminPaymentRow({ tx, onApprove, onReject, actionLoading }) {
  const [tokenAmount, setTokenAmount] = useState('')

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        {tx.proof_url && (
          <a href={tx.proof_url} target="_blank" rel="noreferrer" className="shrink-0">
            <img src={tx.proof_url} alt="proof" className="w-16 h-16 rounded-lg object-cover border border-gray-700" />
          </a>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{tx.user_id.slice(0, 8)}…</p>
          <p className="text-xs text-gray-400">{tx.wallet_type}</p>
          <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={tokenAmount}
          onChange={e => setTokenAmount(e.target.value)}
          placeholder="Tokens to add"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
        <button
          onClick={() => onApprove(tokenAmount)}
          disabled={!tokenAmount || actionLoading === `approve-${tx.id}`}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          Approve
        </button>
        <button
          onClick={onReject}
          disabled={actionLoading === `reject-${tx.id}`}
          className="bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-sm px-3 py-2 rounded-xl transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
