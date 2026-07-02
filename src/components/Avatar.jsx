export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-24 h-24 text-2xl', xl: 'w-32 h-32 text-3xl' }
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-purple-500/50 ${className}`}
      />
    )
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white ring-2 ring-purple-500/50 ${className}`}>
      {initials}
    </div>
  )
}
