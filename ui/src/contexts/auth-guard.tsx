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

        if (!isLoading && !isAuthenticated && !isPublicRoute) {
            router.push('/signin');
        }
    }, [isAuthenticated, isLoading, isPublicRoute, router]);

    // Show a loading state while checking authentication
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // Allow access to public routes or authenticated users
    if (isPublicRoute || isAuthenticated) {
        return <>{children}</>;
    }

    // Optionally, render nothing or a custom unauthorized component while redirecting
    return null;
};

export default AuthGuard;
