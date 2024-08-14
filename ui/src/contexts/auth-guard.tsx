'use client'

import { useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useRouter, usePathname } from '@/routes';

interface AuthGuardProps {
    children: ReactNode;
}

const publicRoutes = ['/signin', '/signup'];

const AuthGuard = ({ children }: AuthGuardProps) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isPublicRoute = publicRoutes.includes(pathname);
    useEffect(() => {
        if (isLoading) return; // Skip redirect if loading

        // If user is not authenticated and trying to access a private route
        if (!isAuthenticated && !isPublicRoute) {
            router.push('/signin');
        }

    }, [isAuthenticated, isLoading, isPublicRoute, router]);

    // Allow access to public routes or authenticated users
    if (isPublicRoute || isAuthenticated) {
        return <>{children}</>;
    }

    // Optionally, render nothing or a custom unauthorized component while redirecting
    return null;
};

export default AuthGuard;
