import { ReactNode } from "react";
import { UserServiceProvider } from "./user-context";
import ThemeProvider from '@/components/theme-provider/theme-provider'

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
            <UserServiceProvider>
                {children}
            </UserServiceProvider>
        </ThemeProvider>
    )
}