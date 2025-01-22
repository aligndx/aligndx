'use client'

import { ReactNode } from "react";
import ThemeProvider from '@/components/theme-provider/theme-provider'
import QueryProvider from "./query-context";
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "./auth-context";
import AuthGuard from "./auth-guard";
import { domAnimation, LazyMotion } from "framer-motion";
import DuckdbProvider from "./duckdb-context";

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <QueryProvider>
            <Toaster richColors position="top-right" />
            <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                <LazyMotion features={domAnimation}>
                    <AuthProvider>
                        <AuthGuard>
                            <DuckdbProvider>
                                {children}
                            </DuckdbProvider>
                        </AuthGuard>
                    </AuthProvider>
                </LazyMotion>
            </ThemeProvider>
        </QueryProvider>
    )
}