import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/auth-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'X-manage-app',
  description: 'A modern web application for managing X (formerly Twitter) posts with analytics and insights.',
  keywords: ['X', 'Twitter', 'Analytics', 'Social Media', 'Management'],
  authors: [{ name: 'X-manage-app Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased tron-grid`}>
        <div className="min-h-screen bg-background">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}