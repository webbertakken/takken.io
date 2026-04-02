import React from 'react'

const RoadmapConnections = (): React.ReactElement => {
  return (
    <svg
      className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="connection-human-dev" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#a855f7" stopOpacity={0.4} />
        </linearGradient>
        <linearGradient id="connection-dev-deep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
        </linearGradient>
      </defs>

      <path
        d="M 33% 180 Q 42% 220, 50% 280"
        fill="none"
        stroke="url(#connection-human-dev)"
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <path
        d="M 66% 280 Q 75% 340, 83% 400"
        fill="none"
        stroke="url(#connection-dev-deep)"
        strokeWidth={2}
        strokeDasharray="6 4"
      />
    </svg>
  )
}

export default RoadmapConnections
