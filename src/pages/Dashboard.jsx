import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTokens } from '../hooks/useTokens'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { SPIN_SEGMENTS, SPIN_PACKAGE_PRICE, MAX_ZEROS_PER_DAY } from '../lib/constants'
import { getSpinWindowStatus, formatCountdown, MAX_DAILY_SPINS } from '../lib/spintime'
import Avatar from '../components/Avatar'

function pickSegment(zerosToday) {
  const pool = zerosToday >= MAX_ZEROS_PER_DAY
    ? SPIN_SEGMENTS.filter(s => s.value !== 0)
    : SPIN_SEGMENTS
  const total = pool.reduce((s, x) => s + x.weight, 0)
  let r = Math.random() * total
  for (const seg of pool) { r -= seg.weight; if (r <= 0) return seg }
  return pool[pool.length - 1]
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
                fill="white" fontSize={9} fontWeight="bold">
                {seg.label}
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

function SpinStatusBanner({ status }) {
  const [secs, setSecs] = useState(status.isOpen ? status.secondsLeft : (status.secondsUntilNext || 0))
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const open = status.isOpen
  return (
    <div className={`rounded-2xl p-4 border flex items-center justify-between ${open ? 'bg-green-900/20 border-green-500/30' : 'bg-orange-900/20 border-orange-500/30'}`}>
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${open ? 'bg-green-400' : 'bg-orange-400'}`} />
        <div>
          <p className={`text-sm font-bold ${open ? 'text-green-400' : 'text-orange-400'}`}>
            🎡 Spin Window {open ? 'OPEN' : 'CLOSED'}
          </p>
          <p className="text-xs text-gray-400">{open ? 'Remaining time' : 'Opens in'}</p>
        </div>
      </div>
      <p className={`text-2xl font-mono font-black tracking-tight ${open ? 'text-green-400' : 'text-orange-400'}`}>
        {formatCountdown(secs)}
      </p>
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
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    const id = setInterval(() => setWindowStatus(getSpinWindowStatus()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    supabase.from('announcements').select('*').eq('active', true)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setAnnouncements(data || []))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const isToday = tokens?.last_spin_date === today
  const hasPurchasedPackage = tokens?.spin_package_date === today
  const spinsUsedToday = isToday ? (tokens?.spins_today ?? 0) : 0
  const zerosToday = isToday ? (tokens?.zeros_today ?? 0) : 0
  const spinsLeft = hasPurchasedPackage ? MAX_DAILY_SPINS - spinsUsedToday : 0
  const canSpin = hasPurchasedPackage && spinsLeft > 0 && windowStatus.isOpen

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'

  const [buying, setBuying] = useState(false)

  const handleBuyPackage = async () => {
    if (buying || hasPurchasedPackage) return
    if ((tokens?.balance ?? 0) < SPIN_PACKAGE_PRICE) {
      setError(`You need ${SPIN_PACKAGE_PRICE} tokens to buy today's spin package`)
      return
    }
    setBuying(true)
    setError('')
    try {
      await supabase.from('user_tokens').upsert({
        user_id: user.id,
        spin_package_date: today,
        spins_today: 0,
        zeros_today: 0,
        last_spin_date: tokens?.last_spin_date || null,
        balance: (tokens?.balance || 0) - SPIN_PACKAGE_PRICE,
        total_earned: tokens?.total_earned || 0,
        total_purchased: tokens?.total_purchased || 0,
        total_withdrawn: tokens?.total_withdrawn || 0,
      }, { onConflict: 'user_id' })

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'spin_package',
        amount: -SPIN_PACKAGE_PRICE,
        status: 'completed',
      })
      refetch()
    } catch (err) {
      setError(err.message)
    } finally {
      setBuying(false)
    }
  }

  const handleSpin = async () => {
    if (!canSpin || spinning) return
    setError('')
    setResult(null)
    setResultIndex(null)
    setShowCelebration(false)

    const chosen = pickSegment(zerosToday)
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
        const newZerosToday = chosen.value === 0 ? zerosToday + 1 : zerosToday
        await supabase.from('user_tokens').upsert({
          user_id: user.id,
          last_spin_date: today,
          spins_today: newSpinsToday,
          zeros_today: newZerosToday,
          spin_package_date: today,
          total_earned: (tokens?.total_earned || 0) + chosen.value,
          balance: (tokens?.balance || 0) + chosen.value,
          total_withdrawn: tokens?.total_withdrawn || 0,
        }, { onConflict: 'user_id' })

        if (chosen.value > 0) {
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'spin_win',
            amount: chosen.value,
            status: 'completed',
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
        <div className="mt-1">
          <h2 className="text-lg font-bold">
            Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''} 👋
          </h2>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>

        {/* News ticker */}
        {announcements.length > 0 && (
          <div className="flex items-center rounded-2xl border border-yellow-500/30 bg-gray-900 overflow-hidden h-11">
            <div className="shrink-0 flex items-center gap-1.5 px-3 h-full bg-yellow-500 rounded-l-2xl">
              <span className="text-black text-sm">📢</span>
              <span className="text-black text-xs font-black uppercase tracking-wide whitespace-nowrap">News</span>
            </div>
            <div className="overflow-hidden flex-1 h-full flex items-center">
              <div className="ticker-track">
                {[...announcements, ...announcements].map((a, i) => (
                  <span key={i} className="flex items-center text-sm font-bold text-white whitespace-nowrap">
                    <span className="text-yellow-400 mx-4">★</span>
                    {a.title}
                    {a.message && (
                      <span className="font-normal text-gray-300"> — {a.message}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Spin window status banner */}
        <SpinStatusBanner status={windowStatus} />

        {/* Spin wheel */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 w-full justify-between">
            <h2 className="font-semibold text-lg">Spin the Wheel</h2>
            <div className="flex items-center gap-1.5 bg-yellow-900/40 border border-yellow-600/40 rounded-full px-3 py-1">
              <span className="text-yellow-400 text-xs font-bold">🎟 {SPIN_PACKAGE_PRICE} tokens = 10 spins</span>
            </div>
          </div>

          {!hasPurchasedPackage ? (
            <div className="w-full flex flex-col items-center gap-3 py-4">
              <div className="text-center space-y-1">
                <p className="text-4xl">🎟️</p>
                <p className="text-white font-bold text-base">Buy Today's Spin Package</p>
                <p className="text-gray-400 text-sm">Pay <span className="text-yellow-400 font-bold">{SPIN_PACKAGE_PRICE} tokens</span> to unlock <span className="text-purple-400 font-bold">10 spins</span> for today</p>
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button onClick={handleBuyPackage} disabled={buying || (tokens?.balance ?? 0) < SPIN_PACKAGE_PRICE}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 font-bold text-lg transition-all text-white">
                {buying ? 'Processing...'
                  : (tokens?.balance ?? 0) < SPIN_PACKAGE_PRICE
                  ? `Need ${SPIN_PACKAGE_PRICE} Tokens`
                  : `Buy 10 Spins for ${SPIN_PACKAGE_PRICE} Tokens 🎟️`}
              </button>
            </div>
          ) : (
            <>
              <SpinWheel spinning={spinning} spinDegrees={spinDegrees} resultIndex={resultIndex} />

              {result && !spinning && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className={`text-center py-2 px-6 rounded-full font-bold text-lg ${
                    result.value > 0 ? 'bg-green-900 text-green-300' : 'bg-red-900/50 text-red-300'
                  }`}>
                  {result.value > 0 ? `🎉 +${result.value} Tokens Won!` : '😔 No Win! Try Again'}
                </motion.div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button onClick={handleSpin} disabled={!canSpin || spinning}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 font-bold text-lg transition-all">
                {spinning ? 'Spinning...'
                  : !windowStatus.isOpen ? 'Window Closed ⏰'
                  : spinsLeft === 0 ? 'All 10 Spins Used Today 🎉'
                  : `SPIN NOW 🎡 (${spinsLeft} left)`}
              </button>
            </>
          )}
        </div>

        {/* Spins counter */}
        <div className="bg-gradient-to-br from-sky-600 to-sky-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <div>
              <p className="text-xs text-white/70 font-medium">Spins Left Today</p>
              <p className="text-2xl font-bold">{spinsLeft} <span className="text-sm font-normal text-white/50">/ {MAX_DAILY_SPINS}</span></p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end max-w-[140px]">
            {Array.from({ length: MAX_DAILY_SPINS }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < spinsUsedToday ? 'bg-white/30' : 'bg-white'}`} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
