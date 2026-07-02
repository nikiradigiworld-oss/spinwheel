export const MAX_DAILY_SPINS = 5

// Spin window: always open (24 hours)
export function getSpinWindowStatus() {
  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setUTCHours(23, 59, 59, 999)
  const secondsLeft = Math.floor((endOfDay - now) / 1000)
  return { isOpen: true, secondsLeft }
}

export function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}
