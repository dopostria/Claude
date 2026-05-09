'use client'

import { useMemo } from 'react'

interface Star {
  id: number
  x: number
  y: number
  duration: number
  delay: number
  size: number
}

export default function StarBackground() {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 180 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      size: Math.random() < 0.85 ? 1 : 2,
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      {stars.map(star => (
        <div
          key={star.id}
          className="star animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
