import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

// ─── Floating particles ───────────────────────────────────────────────────────
const PARTICLES = [
  { left: '8%',  dur: 6,  delay: 0,   size: 3, color: '#ec4899' },
  { left: '22%', dur: 9,  delay: 1.5, size: 4, color: '#a855f7' },
  { left: '38%', dur: 7,  delay: 0.5, size: 2, color: '#f472b6' },
  { left: '55%', dur: 10, delay: 2,   size: 5, color: '#c026d3' },
  { left: '72%', dur: 8,  delay: 1,   size: 3, color: '#db2777' },
  { left: '86%', dur: 6,  delay: 3,   size: 2, color: '#e879f9' },
  { left: '48%', dur: 11, delay: 0.8, size: 4, color: '#ec4899' },
]

// ─── Floating $ signs ─────────────────────────────────────────────────────────
const COINS = [
  { left: '5%',  top: '20%', dur: 3,   delay: 0   },
  { left: '15%', top: '65%', dur: 4,   delay: 0.8 },
  { left: '80%', top: '30%', dur: 3.5, delay: 0.4 },
  { left: '88%', top: '70%', dur: 4.5, delay: 1.2 },
  { left: '42%', top: '10%', dur: 3.2, delay: 0.6 },
]

export default function AuthPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const cardRef = useRef()

  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const springX = useSpring(rotX, { stiffness: 130, damping: 20 })
  const springY = useSpring(rotY, { stiffness: 130, damping: 20 })

  useEffect(() => { if (user) navigate('/', { replace: true }) }, [user, navigate])

  const onMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    rotX.set(((e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)) * -8)
    rotY.set(((e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)) *  8)
  }, [rotX, rotY])

  const onMouseLeave = useCallback(() => { rotX.set(0); rotY.set(0) }, [rotX, rotY])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Wrong email or password.' : err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative"
      style={{ perspective: '1400px' }}
    >
      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left: p.left, bottom: '-10px', width: p.size, height: p.size, background: p.color }}
          animate={{ y: [0, -900, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeOut' }} />
      ))}

      {/* Floating $ signs */}
      {COINS.map((c, i) => (
        <motion.div key={i} className="absolute text-2xl font-bold pointer-events-none select-none"
          style={{ left: c.left, top: c.top, color: '#f59e0b', textShadow: '0 0 20px rgba(245,158,11,0.5)' }}
          animate={{ y: [0, -18, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'easeInOut' }}>
          $
        </motion.div>
      ))}

      {/* Glow blobs */}
      <div className="absolute w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', top: '0%', left: '0%', filter: 'blur(60px)' }} />
      <div className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', bottom: '0%', right: '0%', filter: 'blur(60px)' }} />
      <div className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 70%)', top: '40%', left: '40%', filter: 'blur(50px)' }} />

      {/* ── Main layout: side-by-side ── */}
      <div className="w-full max-w-5xl z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">

        {/* ── LEFT: Title + Hero image ── */}
        <motion.div
          initial={{ opacity: 0, x: -60, scale: 0.9 }}
          animate={{ opacity: 1,  x: 0,   scale: 1   }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex flex-col items-center justify-center relative"
        >
          {/* ── App name & tagline above hero image ── */}
          <div className="text-center mb-6 z-10 relative">

            {/* Title with shimmer glow animation */}
            <div className="relative inline-block">
              <motion.h1
                className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight relative z-10"
                style={{ background: 'linear-gradient(135deg, #f472b6 0%, #e879f9 40%, #c084fc 70%, #f472b6 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                animate={{ backgroundPosition: ['0% center', '200% center', '0% center'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                Spin &amp; SIP Money
              </motion.h1>
              {/* Glow behind title */}
              <motion.div
                className="absolute inset-0 blur-2xl -z-10"
                style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>

            {/* Spin · Win · Earn — each word pops individually */}
            <div className="flex items-center justify-center gap-1 mt-3">
              {[
                { word: 'Spin', color: '#f472b6', shadow: 'rgba(244,114,182,0.8)' },
                { word: 'Win',  color: '#e879f9', shadow: 'rgba(232,121,249,0.8)' },
                { word: 'Earn', color: '#c084fc', shadow: 'rgba(192,132,252,0.8)' },
              ].map(({ word, color, shadow }, i) => (
                <div key={word} className="flex items-center gap-1">
                  <motion.span
                    className="text-lg font-black tracking-[0.2em] uppercase"
                    style={{ color }}
                    animate={{
                      scale:      [1, 1.25, 1],
                      textShadow: [`0 0 0px ${shadow}`, `0 0 20px ${shadow}`, `0 0 0px ${shadow}`],
                      y:          [0, -6, 0],
                    }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
                  >
                    {word}
                  </motion.span>
                  {i < 2 && (
                    <motion.span
                      className="text-white/30 font-bold text-lg mx-1"
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5 }}
                    >·</motion.span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Golden glow behind image */}
          <div className="absolute w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(236,72,153,0.1) 50%, transparent 70%)', filter: 'blur(50px)' }} />

          {/* Hero image wrapper */}
          <div className="relative flex items-end justify-center">

            {/* The hero image */}
            <motion.img
              src="/hero.png"
              alt="Earn money online"
              className="w-80 h-auto relative z-10"
              style={{
                filter: 'drop-shadow(0 20px 60px rgba(245,158,11,0.35)) drop-shadow(0 0 40px rgba(236,72,153,0.2))',
              }}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Stats below image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-white/40 text-sm mb-4 tracking-wide">Join thousands of earners</p>
            <div className="flex items-center justify-center gap-6">
              {[['💰', '10K+', 'Members'], ['🎯', '₹50L+', 'Paid Out'], ['⭐', '4.9', 'Rating']].map(([icon, val, label], i) => (
                <motion.div key={i}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.2, delay: i * 0.35, repeat: Infinity }}
                  className="text-center px-3 py-2 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="text-xl">{icon}</div>
                  <div className="text-white font-bold text-sm mt-0.5">{val}</div>
                  <div className="text-white/30 text-xs">{label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Logo outside + mirror glass card ── */}
        <div className="w-full max-w-sm flex flex-col items-center gap-5"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          {/* ── Spinning logo above form ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center"
          >
            <div className="relative inline-flex items-center justify-center mb-2">
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                style={{ transformStyle: 'preserve-3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 text-2xl"
              >
                🎡
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ boxShadow: ['0 0 16px rgba(236,72,153,0.5)', '0 0 48px rgba(236,72,153,1)', '0 0 16px rgba(236,72,153,0.5)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* ── Mirror glass card — form only inside ── */}
          <motion.div
            ref={cardRef}
            style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
            initial={{ opacity: 0, y: 40, rotateX: -20 }}
            animate={{ opacity: 1, y: 0,  rotateX: 0   }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="w-full relative"
          >
            {/* Shadow depth */}
            <div className="absolute inset-0 rounded-3xl"
              style={{ transform: 'translateZ(-40px) scale(0.9)', background: 'linear-gradient(135deg, rgba(236,72,153,0.55), rgba(168,85,247,0.55))', filter: 'blur(28px)' }} />

            {/* Card */}
            <div className="rounded-3xl p-6 relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(48px)',
                WebkitBackdropFilter: 'blur(48px)',
                border: '1px solid rgba(255,255,255,0.20)',
                boxShadow: '0 32px 100px rgba(236,72,153,0.22), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Mirror edge highlights */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.35) 40%, rgba(255,255,255,0.1) 70%, transparent 95%)' }} />
              <div className="absolute top-0 left-0 bottom-0 w-px"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 60%)' }} />

              {/* Shimmer sweep */}
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.06) 50%, transparent 80%)' }}
                animate={{ x: ['-120%', '220%'] }}
                transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5 }} />

              <form onSubmit={handleLogin} className="space-y-4">
                <p className="text-xs text-white/40 tracking-[0.2em] uppercase text-center mb-5">Welcome Back</p>

                <div>
                  <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Email Address</label>
                  <div className="rounded-2xl flex items-center px-4 transition-all focus-within:ring-1 focus-within:ring-pink-500/50"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <span className="text-pink-400/60 text-sm mr-2">✉</span>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 bg-transparent py-3 text-sm text-white placeholder-white/20 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Password</label>
                  <div className="rounded-2xl flex items-center px-4 transition-all focus-within:ring-1 focus-within:ring-pink-500/50"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <span className="text-pink-400/60 text-sm mr-2">🔒</span>
                    <input type={showPass ? 'text' : 'password'} required value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                      className="flex-1 bg-transparent py-3 text-sm text-white placeholder-white/20 focus:outline-none" />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="text-white/25 hover:text-white/60 transition-colors ml-1 text-sm">
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="text-right -mt-1">
                  <Link to="/forgot-password" className="text-xs text-pink-400/70 hover:text-pink-300 transition-colors">
                    Forgot Password?
                  </Link>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-3 text-xs text-red-300 text-center"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    ⚠️ {error}
                  </motion.div>
                )}

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 40px rgba(236,72,153,0.8)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-2xl py-3.5 font-bold text-sm tracking-wide relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #a855f7 100%)', boxShadow: '0 4px 24px rgba(236,72,153,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                >
                  <motion.span className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.18) 50%, transparent 75%)' }}
                    animate={{ x: ['-120%', '220%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.2 }} />
                  <span className="relative z-10">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Signing in…
                      </span>
                    ) : '✨ Login'}
                  </span>
                </motion.button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
                  <span className="text-xs text-white/20">OR</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
                </div>

                <p className="text-center text-sm text-white/30">
                  New user?{' '}
                  <Link to="/register" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                    Create Account
                  </Link>
                </p>
              </form>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-xs text-white/15 text-center"
          >
            SAM Infinity Resources © 2025
          </motion.p>
        </div>
      </div>
    </div>
  )
}
