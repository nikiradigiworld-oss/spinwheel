import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const TABS = ['Overview', 'Payments', 'Withdrawals', 'Users']

// ─── small reusable pieces ────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <p className={`text-xs font-medium ${color}`}>{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '…'}</p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 font-semibold text-sm">{title}</div>
      <div className="divide-y divide-gray-800">{children}</div>
    </div>
  )
}

// ─── Overview ────────────────────────────────────────────────────────────────

function OverviewTab({ pendingPayments, pendingWithdrawals }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ count: userCount }, { data: tokenRows }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_tokens').select('balance, total_earned, total_purchased, total_withdrawn'),
      ])
      const totals = (tokenRows || []).reduce(
        (acc, r) => ({
          balance:   acc.balance   + (r.balance   || 0),
          earned:    acc.earned    + (r.total_earned    || 0),
          purchased: acc.purchased + (r.total_purchased || 0),
          withdrawn: acc.withdrawn + (r.total_withdrawn || 0),
        }),
        { balance: 0, earned: 0, purchased: 0, withdrawn: 0 }
      )
      setStats({ userCount, ...totals })
    }
    load()
  }, [])

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Total Users"           value={stats?.userCount}       icon="👥" color="text-blue-400"   />
      <StatCard label="Pending Payments"       value={pendingPayments}        icon="⏳" color="text-yellow-400" />
      <StatCard label="Pending Withdrawals"    value={pendingWithdrawals}     icon="💸" color="text-orange-400" />
      <StatCard label="Tokens in Circulation"  value={stats?.balance}         icon="💎" color="text-green-400"  />
      <StatCard label="Total Tokens Earned"    value={stats?.earned}          icon="🎡" color="text-purple-400" />
      <StatCard label="Total Purchased"        value={stats?.purchased}       icon="🛒" color="text-indigo-400" />
      <StatCard label="Total Withdrawn"        value={stats?.withdrawn}       icon="💰" color="text-pink-400"   />
    </div>
  )
}

// ─── Payments ─────────────────────────────────────────────────────────────────

function PaymentRow({ tx, onApprove, onReject, actionLoading }) {
  const [amount, setAmount] = useState('')
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
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Tokens to add"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
        <button
          onClick={() => onApprove(amount)}
          disabled={!amount || actionLoading === `approve-${tx.id}`}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          {actionLoading === `approve-${tx.id}` ? '…' : 'Approve'}
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

function PaymentsTab({ payments, onApprove, onReject, actionLoading }) {
  return (
    <Section title={`Pending Payments (${payments.length})`}>
      {payments.length === 0
        ? <p className="text-gray-500 text-sm p-4">No pending payments.</p>
        : payments.map(tx => (
          <PaymentRow
            key={tx.id}
            tx={tx}
            onApprove={amount => onApprove(tx, amount)}
            onReject={() => onReject(tx.id)}
            actionLoading={actionLoading}
          />
        ))
      }
    </Section>
  )
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

function WithdrawalsTab({ withdrawals, onMarkPaid, actionLoading }) {
  return (
    <Section title={`Pending Withdrawals (${withdrawals.length})`}>
      {withdrawals.length === 0
        ? <p className="text-gray-500 text-sm p-4">No pending withdrawals.</p>
        : withdrawals.map(tx => (
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
              onClick={() => onMarkPaid(tx.id)}
              disabled={actionLoading === `paid-${tx.id}`}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm py-2 rounded-xl transition-colors"
            >
              {actionLoading === `paid-${tx.id}` ? 'Processing…' : 'Mark as Paid'}
            </button>
          </div>
        ))
      }
    </Section>
  )
}

// ─── Users ────────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [amounts, setAmounts] = useState({})
  const [saving, setSaving]   = useState(null)
  const [msg, setMsg]         = useState({})

  const loadUsers = useCallback(async () => {
    const [{ data: profiles }, { data: tokens }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_tokens').select('*'),
    ])
    const tokenMap = {}
    ;(tokens || []).forEach(t => { tokenMap[t.user_id] = t })
    const merged = (profiles || [])
      .map(p => ({ ...p, tokens: tokenMap[p.user_id] || null }))
      .sort((a, b) => (b.tokens?.balance || 0) - (a.tokens?.balance || 0))
    setUsers(merged)
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const applyTokens = async (userId, rawAmount, current) => {
    const n = parseInt(rawAmount)
    if (!n || isNaN(n)) return
    setSaving(userId)
    try {
      const newBalance   = Math.max(0, (current?.balance || 0) + n)
      const newEarned    = n > 0 ? (current?.total_earned || 0) + n : (current?.total_earned || 0)
      await supabase.from('user_tokens').upsert({
        user_id:         userId,
        balance:         newBalance,
        total_earned:    newEarned,
        total_purchased: current?.total_purchased || 0,
        total_withdrawn: current?.total_withdrawn || 0,
      }, { onConflict: 'user_id' })

      if (n !== 0) {
        await supabase.from('transactions').insert({
          user_id: userId,
          type:    n > 0 ? 'admin_credit' : 'admin_debit',
          amount:  Math.abs(n),
          status:  'completed',
        })
      }

      setMsg(m => ({ ...m, [userId]: n > 0 ? `+${n} tokens added ✅` : `${n} tokens deducted ✅` }))
      setAmounts(a => ({ ...a, [userId]: '' }))
      setTimeout(() => setMsg(m => ({ ...m, [userId]: '' })), 3000)
      await loadUsers()
    } finally {
      setSaving(null)
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.user_id?.toLowerCase().includes(search.toLowerCase())
  )

  const downloadExcel = () => {
    const rows = [
      ['Name', 'Country', 'Gender', 'DOB', 'Referral Code', 'Balance', 'Total Earned', 'Total Purchased', 'Total Withdrawn', 'Referral Tokens', 'Joined'],
      ...users.map(u => [
        u.full_name || '',
        u.country   || '',
        u.gender    || '',
        u.dob       || '',
        u.referral_code || '',
        u.tokens?.balance          || 0,
        u.tokens?.total_earned     || 0,
        u.tokens?.total_purchased  || 0,
        u.tokens?.total_withdrawn  || 0,
        u.tokens?.referral_tokens  || 0,
        u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `spinwheel-users-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search name or user ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={downloadExcel}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-600 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
        >
          📥 Download Excel
        </button>
      </div>
      <p className="text-xs text-gray-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-3">
        {filtered.map(u => (
          <div key={u.user_id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">

            {/* User info row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-white">{u.full_name || 'Unknown'}</p>
                <p className="text-xs text-gray-500 font-mono">{u.user_id.slice(0, 16)}…</p>
                {u.country && <p className="text-xs text-gray-500">🌍 {u.country}</p>}
                {u.gender && <p className="text-xs text-gray-600">{u.gender}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-green-400">{u.tokens?.balance ?? 0}</p>
                <p className="text-xs text-gray-500">balance</p>
              </div>
            </div>

            {/* Token breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { label: 'Earned',    value: u.tokens?.total_earned    ?? 0, color: 'text-purple-400' },
                { label: 'Purchased', value: u.tokens?.total_purchased ?? 0, color: 'text-indigo-400' },
                { label: 'Withdrawn', value: u.tokens?.total_withdrawn ?? 0, color: 'text-orange-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800 rounded-lg py-2">
                  <p className={`font-bold ${color}`}>{value}</p>
                  <p className="text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Manual token adjustment */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">Adjust tokens (positive to add, negative to deduct)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amounts[u.user_id] || ''}
                  onChange={e => setAmounts(a => ({ ...a, [u.user_id]: e.target.value }))}
                  placeholder="e.g. 50 or -20"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => applyTokens(u.user_id, amounts[u.user_id], u.tokens)}
                  disabled={!amounts[u.user_id] || saving === u.user_id}
                  className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                >
                  {saving === u.user_id ? '…' : 'Apply'}
                </button>
              </div>
              {msg[u.user_id] && <p className="text-xs text-green-400">{msg[u.user_id]}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Overview')
  const [payments, setPayments]     = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading]       = useState(true)
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
    const amount = parseInt(tokenAmount, 10)
    if (!amount || amount <= 0) return
    const key = `approve-${tx.id}`
    setActionLoading(key)
    try {
      const { data: tokenRow } = await supabase.from('user_tokens').select('*').eq('user_id', tx.user_id).single()
      await Promise.all([
        supabase.from('transactions').update({ status: 'completed', amount }).eq('id', tx.id),
        supabase.from('user_tokens').upsert({
          user_id: tx.user_id,
          total_purchased: (tokenRow?.total_purchased || 0) + amount,
          total_earned:    (tokenRow?.total_earned    || 0) + amount,
          balance:         (tokenRow?.balance         || 0) + amount,
          total_withdrawn: tokenRow?.total_withdrawn || 0,
        }, { onConflict: 'user_id' }),
      ])
      load()
    } finally { setActionLoading(null) }
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
    <div className="min-h-screen bg-gray-950 pb-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-yellow-400">Admin Panel</h1>
            <p className="text-xs text-gray-500">Spin &amp; SIP Money</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/')}
              className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg hover:text-white">
              App
            </button>
            <button onClick={handleSignOut}
              className="text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-900/20">
              Logout
            </button>
          </div>
        </div>

        {/* Pending badges */}
        {(payments.length > 0 || withdrawals.length > 0) && (
          <div className="px-4 pt-3 flex gap-2">
            {payments.length > 0 && (
              <button onClick={() => setActiveTab('Payments')}
                className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-3 py-1.5 rounded-full">
                ⚠️ {payments.length} payment{payments.length > 1 ? 's' : ''} pending
              </button>
            )}
            {withdrawals.length > 0 && (
              <button onClick={() => setActiveTab('Withdrawals')}
                className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs px-3 py-1.5 rounded-full">
                ⚠️ {withdrawals.length} withdrawal{withdrawals.length > 1 ? 's' : ''} pending
              </button>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-4 pb-2 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                  : 'text-gray-500 hover:text-gray-300'
              }`}>
              {tab}
              {tab === 'Payments'    && payments.length    > 0 && <span className="ml-1.5 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{payments.length}</span>}
              {tab === 'Withdrawals' && withdrawals.length > 0 && <span className="ml-1.5 bg-orange-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{withdrawals.length}</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 pt-2 space-y-4">
          {activeTab === 'Overview'    && <OverviewTab pendingPayments={payments.length} pendingWithdrawals={withdrawals.length} />}
          {activeTab === 'Payments'    && <PaymentsTab payments={payments} onApprove={approvePayment} onReject={rejectPayment} actionLoading={actionLoading} />}
          {activeTab === 'Withdrawals' && <WithdrawalsTab withdrawals={withdrawals} onMarkPaid={markWithdrawalPaid} actionLoading={actionLoading} />}
          {activeTab === 'Users'       && <UsersTab />}
        </div>

      </div>
    </div>
  )
}
