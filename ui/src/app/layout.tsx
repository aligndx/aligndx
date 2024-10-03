import './globals.css'
import type { Metadata } from 'next'
import { Atkinson_Hyperlegible } from 'next/font/google'
import { ReactNode } from 'react'
import { siteConfig } from '@/config'
import Providers from '@/contexts/providers'
import NextTopLoader from 'nextjs-toploader';

const inter = Atkinson_Hyperlegible({ weight: "400", subsets: ["latin"] })

export const metadata: Metadata = {
  description: siteConfig.description,
  manifest: `${siteConfig.url}/site.webmanifest`,
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextTopLoader showSpinner={false} color='#2661a1' />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}