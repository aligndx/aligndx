import { ReactNode } from "react"
import { MarketingLayout as Layout } from "@/layouts/marketing"

interface MarketingLayoutProps {
    children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
    return <Layout>{children}</Layout>
}