import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const TYPE_LABELS = {
  spin_win: { label: 'Spin Win',  icon: '🎡', color: 'text-green-400' },
  buy:      { label: 'Buy Token', icon: '💰', color: 'text-blue-400'  },
  withdraw: { label: 'Withdraw',  icon: '💸', color: 'text-orange-400'},
}

const STATUS_COLORS = {
  completed: 'bg-green-900/40 text-green-400',
  pending:   'bg-yellow-900/40 text-yellow-400',
  rejected:  'bg-red-900/40 text-red-400',
  processing:'bg-blue-900/40 text-blue-400',
}

export default function History() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTransactions(data || [])
        setLoading(false)
      })
  }, [user])

  if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4 pb-4 mt-2">
      <h1 className="text-xl font-bold">Transaction History</h1>

      {transactions.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <div className="text-4xl mb-3">📭</div>
          <p>No transactions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => {
            const meta = TYPE_LABELS[tx.type] || { label: tx.type, icon: '📄', color: 'text-gray-400' }
            const date = new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            return (
              <div key={tx.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-3">
                <div className="text-2xl">{meta.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${meta.color}`}>{meta.label}</p>
                  <p className="text-xs text-gray-500">{date}</p>
                  {tx.wallet_type && <p className="text-xs text-gray-500">{tx.wallet_type}</p>}
                </div>
                <div className="text-right">
                  {tx.amount != null && (
                    <p className="font-bold text-white">{tx.amount > 0 ? `+${tx.amount}` : tx.amount}</p>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[tx.status] || 'bg-gray-800 text-gray-400'}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
