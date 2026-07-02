import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTokens } from '../hooks/useTokens'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { SPIN_SEGMENTS } from '../lib/constants'
import { getSpinWindowStatus, formatCountdown, MAX_DAILY_SPINS } from '../lib/spintime'
import Avatar from '../components/Avatar'

function pickSegment() {
  const total = SPIN_SEGMENTS.reduce((s, x) => s + x.weight, 0)
  let r = Math.random() * total
  for (const seg of SPIN_SEGMENTS) { r -= seg.weight; if (r <= 0) return seg }
  return SPIN_SEGMENTS[0]
}

function SpinWheel({ spinning, spinDegrees, resultIndex }) {
  const count = SPIN_SEGMENTS.length
  const angle = 360 / count
  const radius = 110, cx = 140, cy = 140

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-2xl drop-shadow-lg">▼</div>
      <div className={`absolute w-72 h-72 rounded-full transition-all duration-300 ${spinning ? 'shadow-[0_0_40px_rgba(109,40,217,0.5)]' : 'shadow-[0_0_15px_rgba(109,40,217,0.2)]'}`} />
      <svg
        width={280} height={280}
        style={{
          transform: `rotate(${spinDegrees}deg)`,
          transition: spinning ? 'transform 4s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
        }}
      >
        {SPIN_SEGMENTS.map((seg, i) => {
          const sa = (i * angle - 90) * (Math.PI / 180)
          const ea = ((i + 1) * angle - 90) * (Math.PI / 180)
          const x1 = cx + radius * Math.cos(sa), y1 = cy + radius * Math.sin(sa)
          const x2 = cx + radius * Math.cos(ea), y2 = cy + radius * Math.sin(ea)
          const ma = ((i + 0.5) * angle - 90) * (Math.PI / 180)
          const tx = cx + radius * 0.65 * Math.cos(ma), ty = cy + radius * 0.65 * Math.sin(ma)
          const isResult = !spinning && resultIndex === i
          return (
            <g key={i}>
              <path
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                fill={seg.color}
                stroke="#0a0a1a"
                strokeWidth={2}
                opacity={!spinning && resultIndex !== null && !isResult ? 0.5 : 1}
              />
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={seg.value === 0 ? 8 : 13} fontWeight="bold">
                {seg.value === 0 ? 'Try Again' : seg.label}
              </text>
            </g>
          )
        })}
        <circle cx={cx} cy={cy} r={20} fill="#0d0825" stroke="#6d28d9" strokeWidth={3} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight="bold">SPIN</text>
      </svg>
    </div>
  )
}

function Countdown({ status }) {
  const [secs, setSecs] = useState(
    status.isOpen ? status.secondsLeft : status.secondsUntilNext
  )
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  if (status.isOpen) {
    return (
      <div className="text-center space-y-1">
        <p className="text-xs text-green-400 font-medium">✅ Spin window is OPEN</p>
        <p className="text-xs text-gray-400">Closes in</p>
        <p className="text-2xl font-mono font-bold text-green-400">{formatCountdown(secs)}</p>
      </div>
    )
  }
  return (
    <div className="text-center space-y-1">
      <p className="text-xs text-orange-400 font-medium">⏰ Next spin window opens in</p>
      <p className="text-3xl font-mono font-bold text-orange-400">{formatCountdown(secs)}</p>
      <p className="text-xs text-gray-500">Windows: 08:00–10:00 & 20:00–22:00 UTC</p>
    </div>
  )
}

const PARTICLES = [
  { emoji: '🌟', left: 8,  delay: 0    },
  { emoji: '⭐', left: 20, delay: 0.3  },
  { emoji: '💫', left: 33, delay: 0.1  },
  { emoji: '✨', left: 47, delay: 0.55 },
  { emoji: '🎊', left: 60, delay: 0.2  },
  { emoji: '🎉', left: 75, delay: 0.45 },
  { emoji: '💰', left: 88, delay: 0.65 },
  { emoji: '🪙', left: 14, delay: 0.8  },
  { emoji: '🌟', left: 52, delay: 0.15 },
  { emoji: '⭐', left: 38, delay: 0.7  },
  { emoji: '✨', left: 82, delay: 0.35 },
  { emoji: '💫', left: 96, delay: 0.9  },
]

function CelebrationOverlay({ result, avatarSrc, displayName, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onDismiss}
    >
      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="fixed text-2xl pointer-events-none select-none"
          style={{ left: `${p.left}%` }}
          initial={{ y: '105vh', opacity: 1 }}
          animate={{ y: '-10vh', opacity: [1, 1, 0] }}
          transition={{ duration: 2.8, delay: p.delay, repeat: Infinity, repeatDelay: 0.3, ease: 'easeOut' }}
        >
          {p.emoji}
        </motion.span>
      ))}

      {/* Card */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.55 }}
        className="relative bg-gray-900 border border-purple-500/60 rounded-3xl p-8 text-center space-y-5 max-w-xs mx-4 shadow-[0_0_80px_rgba(109,40,217,0.45)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Pulsing glow ring behind card */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{ boxShadow: ['0 0 30px rgba(109,40,217,0.3)', '0 0 70px rgba(109,40,217,0.7)', '0 0 30px rgba(109,40,217,0.3)'] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />

        {/* Dancing avatar */}
        <div className="flex justify-center">
          <motion.div
            animate={{ rotate: [-10, 10, -10], y: [0, -16, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              animate={{ filter: ['drop-shadow(0 0 8px rgba(109,40,217,0.5))', 'drop-shadow(0 0 24px rgba(109,40,217,1))', 'drop-shadow(0 0 8px rgba(109,40,217,0.5))'] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="rounded-full"
            >
              <Avatar src={avatarSrc} name={displayName} size="lg" />
            </motion.div>
          </motion.div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <motion.p
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="text-xl font-extrabold text-white leading-tight"
          >
            🎉 Congratulations! 🎉
          </motion.p>

          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.25, type: 'spring', bounce: 0.6 }}
          >
            <motion.p
              animate={{ textShadow: ['0 0 10px rgba(250,204,21,0.6)', '0 0 30px rgba(250,204,21,1)', '0 0 10px rgba(250,204,21,0.6)'] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-6xl font-black text-yellow-400"
            >
              +{result.value}
            </motion.p>
          </motion.div>

          <p className="text-purple-300 font-bold text-lg tracking-wide">Tokens Won!</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onDismiss}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl py-3 font-bold text-lg transition-all"
        >
          Keep Spinning! 🎡
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { tokens, loading, refetch } = useTokens()
  const { profile } = useProfile()
  const [spinning, setSpinning] = useState(false)
  const [spinDegrees, setSpinDegrees] = useState(0)
  const [result, setResult] = useState(null)
  const [resultIndex, setResultIndex] = useState(null)
  const [error, setError] = useState('')
  const [windowStatus, setWindowStatus] = useState(getSpinWindowStatus())
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setWindowStatus(getSpinWindowStatus()), 30000)
    return () => clearInterval(id)
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const spinsUsedToday = tokens?.last_spin_date === today ? (tokens?.spins_today ?? 0) : 0
  const spinsLeft = MAX_DAILY_SPINS - spinsUsedToday
  const canSpin = spinsLeft > 0 && windowStatus.isOpen

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'

  const handleSpin = async () => {
    if (!canSpin || spinning) return
    setError('')
    setResult(null)
    setResultIndex(null)
    setShowCelebration(false)

    const chosen = pickSegment()
    const idx = SPIN_SEGMENTS.indexOf(chosen)

    const segmentAngle = 360 / SPIN_SEGMENTS.length
    const landOffset = idx * segmentAngle + segmentAngle / 2
    const totalDegrees = spinDegrees + 5 * 360 + landOffset
    setSpinDegrees(totalDegrees)
    setSpinning(true)

    setTimeout(async () => {
      setSpinning(false)
      setResultIndex(idx)
      setResult(chosen)
      if (chosen.value > 0) setShowCelebration(true)
      try {
        const newSpinsToday = spinsUsedToday + 1
        await supabase.from('user_tokens').upsert({
          user_id: user.id,
          last_spin_date: today,
          spins_today: newSpinsToday,
          total_earned: (tokens?.total_earned || 0) + chosen.value,
          balance: (tokens?.balance || 0) + chosen.value,
          total_withdrawn: tokens?.total_withdrawn || 0,
        }, { onConflict: 'user_id' })

        if (chosen.value > 0) {
          await supabase.from('transactions').insert({
            user_id: user.id, type: 'spin_win', amount: chosen.value, status: 'completed',
          })
        }
        refetch()
      } catch (err) {
        setError(err.message)
      }
    }, 4000)
  }

  const dismissCelebration = useCallback(() => setShowCelebration(false), [])

  if (loading) return (
    <div className="flex justify-center mt-20">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {showCelebration && result && (
          <CelebrationOverlay
            result={result}
            avatarSrc={profile?.avatar_url}
            displayName={displayName}
            onDismiss={dismissCelebration}
          />
        )}
      </AnimatePresence>

      <div className="space-y-4 pb-4">
        {/* Welcome */}
        <div className="mt-2">
          <h2 className="text-lg font-bold">
            Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''} 👋
          </h2>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Purchased',  icon: '🛒', value: tokens?.total_purchased ?? 0,  color: 'from-indigo-600 to-indigo-800' },
            { label: 'Earned',     icon: '🎡', value: tokens?.total_earned ?? 0,     color: 'from-purple-600 to-purple-800' },
            { label: 'Reference',  icon: '🤝', value: tokens?.referral_tokens ?? 0,  color: 'from-pink-600 to-pink-800'    },
            { label: 'Available',  icon: '💎', value: tokens?.balance ?? 0,          color: 'from-green-600 to-green-800'  },
            { label: 'Withdrawn',  icon: '💸', value: tokens?.total_withdrawn ?? 0,  color: 'from-orange-600 to-orange-800'},
          ].map(({ label, icon, value, color }) => (
            <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-4`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{icon}</span>
                <p className="text-xs text-white/70 font-medium">{label}</p>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-white/40">tokens</p>
            </div>
          ))}
          <div className="bg-gradient-to-br from-sky-600 to-sky-800 rounded-2xl p-4 col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-xs text-white/70 font-medium">Spins Left Today</p>
                <p className="text-2xl font-bold">{spinsLeft} <span className="text-sm font-normal text-white/50">/ {MAX_DAILY_SPINS}</span></p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_DAILY_SPINS }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < spinsUsedToday ? 'bg-white/30' : 'bg-white'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Spin wheel */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col items-center gap-3">
          <h2 className="font-semibold text-lg">Spin the Wheel</h2>

          <div className="bg-gray-800 rounded-xl px-4 py-3 w-full">
            <Countdown status={windowStatus} />
          </div>

          <SpinWheel spinning={spinning} spinDegrees={spinDegrees} resultIndex={resultIndex} />

          {result && !spinning && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`text-center py-2 px-6 rounded-full font-bold text-lg ${
                result.value > 0 ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-300'
              }`}>
              {result.value > 0 ? `🎉 +${result.value} Tokens Won!` : '😔 Try Again!'}
            </motion.div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handleSpin} disabled={!canSpin || spinning}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 font-bold text-lg transition-all">
            {spinning ? 'Spinning...'
              : !windowStatus.isOpen ? 'Window Closed ⏰'
              : spinsLeft === 0 ? 'No Spins Left Today'
              : 'SPIN NOW 🎡'}
          </button>
        </div>
      </div>
    </>
  )
}
