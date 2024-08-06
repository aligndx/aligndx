import './globals.css'
import type { Metadata } from 'next'
import { Atkinson_Hyperlegible } from 'next/font/google'
import { ReactNode } from 'react'
import { siteConfig } from '@/config'
import ThemeProvider from '@/components/theme-provider/theme-provider'

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
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}