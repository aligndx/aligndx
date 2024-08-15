'use client'

import { useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useRouter, usePathname, routes } from '@/routes';

interface AuthGuardProps {
    children: ReactNode;
}

const publicRoutes = ['/signin', '/signup'];

const AuthGuard = ({ children }: AuthGuardProps) => {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isPublicRoute = publicRoutes.includes(pathname);

    useEffect(() => {
        // If user is not authenticated and trying to access a private route
        if (!isAuthenticated && !isPublicRoute) {
            router.push(routes.auth.signin);
        }
    }, [isAuthenticated, isPublicRoute, router]);

    // If user is not authenticated and it's not a public route, render nothing
    if (!isAuthenticated && !isPublicRoute) {
        return null;
    }

    // Allow access to public routes or authenticated users
    return <>{children}</>;
};

export default AuthGuard;
