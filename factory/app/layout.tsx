import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CantSleept Content Factory',
  description: 'Daily content production system for @CantSleept',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-space overflow-hidden">
        {children}
      </body>
    </html>
  )
}
