'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import { RecordModel } from 'pocketbase';
import { useApiService } from '@/services/api';

interface AuthContextType {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (email: string, password: string, additionalData?: any) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    confirmPasswordReset: (passwordResetToken: string, password: string, passwordConfirm: string) => Promise<void>;
    currentUser: RecordModel | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode}) => {
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
    const login = async (email: string, password: string) => {
        await loginMutation.mutateAsync({ email, password });
    };

    const logout = async () => {
        await logoutMutation.mutateAsync();
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
