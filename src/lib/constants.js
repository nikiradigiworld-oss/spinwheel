export const WALLETS = {
  TRC20: import.meta.env.VITE_TRC20_WALLET || 'TRC20_WALLET_ADDRESS_HERE',
  BEP20: import.meta.env.VITE_BEP20_WALLET || 'BEP20_WALLET_ADDRESS_HERE',
}

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@saminfinity.com'

// Spin wheel segments: value => weight (higher = more likely)
export const SPIN_SEGMENTS = [
  { label: 'Try Again', value: 0, color: '#374151', weight: 50 },
  { label: '5',        value: 5,   color: '#7c3aed', weight: 20 },
  { label: '10',       value: 10,  color: '#2563eb', weight: 12 },
  { label: '20',       value: 20,  color: '#059669', weight: 10 },
  { label: '50',       value: 50,  color: '#d97706', weight: 5  },
  { label: '100',      value: 100, color: '#dc2626', weight: 3  },
]

export const MIN_WITHDRAW_TOKENS = 200
export const TDS_PERCENT = 1 // TDS deduction on withdrawal
