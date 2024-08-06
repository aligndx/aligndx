import { ReactNode } from "react"
import { DashboardLayout as Layout } from "@/layouts/dashboard"

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return <Layout>{children}</Layout>
}