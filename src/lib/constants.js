export const WALLETS = {
  TRC20: import.meta.env.VITE_TRC20_WALLET || 'TRC20_WALLET_ADDRESS_HERE',
  BEP20: import.meta.env.VITE_BEP20_WALLET || 'BEP20_WALLET_ADDRESS_HERE',
}

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@saminfinity.com'

export const SPIN_PACKAGE_PRICE = 50  // pay once per day to unlock 10 spins
export const MAX_ZEROS_PER_DAY = 2

// 25 spin segments: 10 big wins (15-30), 12 medium wins (1-12), 3 zeros
export const SPIN_SEGMENTS = [
  // Big wins (15–30) — warm/gold tones
  { label: '30', value: 30, color: '#dc2626', weight: 4 },
  { label: '28', value: 28, color: '#b91c1c', weight: 4 },
  { label: '26', value: 26, color: '#ea580c', weight: 4 },
  { label: '25', value: 25, color: '#f59e0b', weight: 4 },
  { label: '24', value: 24, color: '#d97706', weight: 4 },
  { label: '22', value: 22, color: '#ca8a04', weight: 4 },
  { label: '20', value: 20, color: '#a16207', weight: 4 },
  { label: '18', value: 18, color: '#c2410c', weight: 4 },
  { label: '17', value: 17, color: '#9a3412', weight: 4 },
  { label: '15', value: 15, color: '#b45309', weight: 4 },
  // Medium wins (1–12) — cool/blue-purple tones
  { label: '12', value: 12, color: '#059669', weight: 4 },
  { label: '11', value: 11, color: '#047857', weight: 4 },
  { label: '10', value: 10, color: '#0284c7', weight: 4 },
  { label: '9',  value:  9, color: '#0369a1', weight: 4 },
  { label: '8',  value:  8, color: '#2563eb', weight: 4 },
  { label: '7',  value:  7, color: '#1d4ed8', weight: 4 },
  { label: '6',  value:  6, color: '#7c3aed', weight: 4 },
  { label: '5',  value:  5, color: '#6d28d9', weight: 4 },
  { label: '4',  value:  4, color: '#7e22ce', weight: 4 },
  { label: '3',  value:  3, color: '#9333ea', weight: 4 },
  { label: '2',  value:  2, color: '#a855f7', weight: 4 },
  { label: '1',  value:  1, color: '#c026d3', weight: 4 },
  // Zero / lose — dark grays
  { label: '0', value: 0, color: '#374151', weight: 4 },
  { label: '0', value: 0, color: '#1f2937', weight: 4 },
  { label: '0', value: 0, color: '#111827', weight: 4 },
]

export const MIN_WITHDRAW_TOKENS = 200
export const TDS_PERCENT = 1
export const REFERRAL_BONUS = 10             // on signup
export const REFERRAL_PURCHASE_BONUS = 10    // when referred friend buys ≥100 tokens
export const REFERRAL_PURCHASE_THRESHOLD = 100
