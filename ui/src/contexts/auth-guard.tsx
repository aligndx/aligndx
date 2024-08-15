'use client'

import { useEffect, ReactNode, useState } from 'react';
import { useAuth } from './auth-context';
import { useRouter, usePathname, routes} from '@/routes';
import { publicRoutes } from '@/routes/routes';
import SplashScreen from '@/components/splash-screen/splash-screen';

interface AuthGuardProps {
    children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isPublicRoute = publicRoutes.includes(pathname);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated && !isPublicRoute) {
            router.push(routes.auth.signin);
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, isPublicRoute, router]);

    if (loading) {
        return <SplashScreen />; 
    }

    return <>{children}</>;
};


export default AuthGuard;
