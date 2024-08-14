'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import { RecordModel } from 'pocketbase';
import { useApiService } from '@/services/api';
import { routes, useRouter } from '@/routes';
import { toast } from "@/components/ui/sonner"
import { User } from '@/types/user';

interface AuthContextType {
    login: (email: string, password: string) => void;
    logout: () => void;
    register: (email: string, password: string, additionalData?: any) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    confirmPasswordReset: (passwordResetToken: string, password: string, passwordConfirm: string) => Promise<void>;
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const {
        auth
    } = useApiService();
    const {
        loginMutation,
        logoutMutation,
        registerMutation,
        requestPasswordResetMutation,
        confirmPasswordResetMutation,
        currentUserQuery,
        authStatusQuery,
    } = auth
    const router = useRouter()

    const login = (email: string, password: string) => {
        loginMutation.mutate({ email, password },
            {
                onSuccess() {
                    toast.success("Login Successful")
                },
                onError: () => {
                    toast.error("Login Failed")
                },
            }
        );
        router.push(routes.dashboard.root)
    };

    const logout = () => {
        logoutMutation.mutate(undefined, {
            onSuccess() {
                toast.success("Logout Successful")
            },
            onError: () => {
                toast.error("Logout Failed")
            },
        });
        router.push(routes.auth.signin)
    };

    const register = async (email: string, password: string, additionalData?: any) => {
        await registerMutation.mutateAsync({ email, password, additionalData });
    };

    const requestPasswordReset = async (email: string) => {
        await requestPasswordResetMutation.mutateAsync(email);
    };

    const confirmPasswordReset = async (passwordResetToken: string, password: string, passwordConfirm: string) => {
        await confirmPasswordResetMutation.mutateAsync({ passwordResetToken, password, passwordConfirm });
    };

    const contextValue: AuthContextType = {
        login,
        logout,
        register,
        requestPasswordReset,
        confirmPasswordReset,
        currentUser: currentUserQuery.data ?? null,
        isAuthenticated: authStatusQuery.data ?? false,
        isLoading: currentUserQuery.isLoading || authStatusQuery.isLoading,
    };

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
