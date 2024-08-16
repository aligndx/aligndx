'use client'

import { ReactNode } from "react";
import ThemeProvider from '@/components/theme-provider/theme-provider'
import QueryProvider from "./query-context";
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "./auth-context";
import AuthGuard from "./auth-guard";
import { domAnimation, LazyMotion } from "framer-motion";

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <QueryProvider>
            <Toaster richColors position="top-right" />
            <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                <AuthProvider>
                    <LazyMotion features={domAnimation}>
                        <AuthGuard>
                            {children}
                        </AuthGuard>
                    </LazyMotion>
                </AuthProvider>
            </ThemeProvider>
        </QueryProvider>
    )
}