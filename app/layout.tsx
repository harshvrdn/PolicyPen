import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PolicyPen',
  description: 'AI-powered legal document generator for SaaS products',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  )
}
