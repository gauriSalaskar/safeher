import type { Metadata, Viewport } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import SettingsProvider from '@/components/ui/SettingsProvider'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'SafeHer — AI-Powered Women Safety',
  description: 'Silent SOS, live tracking, and AI-powered protection for women in dangerous situations.',
  keywords: ['women safety', 'emergency app', 'SOS', 'live tracking', 'AI safety'],
  authors: [{ name: 'SafeHer Team' }],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'SafeHer' },
  openGraph: {
    title: 'SafeHer — Your Silent Guardian',
    description: 'AI-powered emergency safety platform for women',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#080B14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-brand-dark text-brand-text font-dm antialiased">
        <SettingsProvider>{children}</SettingsProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#1a2236', color: '#F0F4FF', border: '1px solid #1e2d47' },
            success: { iconTheme: { primary: '#00E676', secondary: '#1a2236' } },
            error: { iconTheme: { primary: '#FF2D55', secondary: '#1a2236' } },
          }}
        />
      </body>
    </html>
  )
}
