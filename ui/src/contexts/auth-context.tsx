'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useApiService } from '@/services/api';
import { routes, useRouter } from '@/routes';
import { toast } from "@/components/ui/sonner"
import { User } from '@/types/user';
import { RecordModel } from 'pocketbase';

interface AuthContextType {
    login: (email: string, password: string) => void;
    logout: () => void;
    register: (email: string, password: string, additionalData?: any) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    confirmPasswordReset: (passwordResetToken: string, password: string, passwordConfirm: string) => Promise<void>;
    currentUser: RecordModel | User | null;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const {
        auth
    } = useApiService();
    const {
        loginMutation,
        logout : logoutAction,
        registerMutation,
        requestPasswordResetMutation,
        confirmPasswordResetMutation,
        getCurrentUser,
        isAuthenticated: checkIsAuthenticated,
    } = auth
    const router = useRouter()
    const [currentUser, setCurrentUser] = useState<RecordModel| User | null >(getCurrentUser());
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(checkIsAuthenticated());

    useEffect(() => {
        setCurrentUser(getCurrentUser());
        setIsAuthenticated(checkIsAuthenticated());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = (email: string, password: string) => {
        loginMutation.mutateAsync({ email, password },
            {
                onSuccess() {
                    setCurrentUser(getCurrentUser());
                    setIsAuthenticated(checkIsAuthenticated());
                    toast.success("Login Successful")
                    router.push(routes.dashboard.root)
                },
                onError: () => {
                    toast.error("Login Failed")
                },
            }
        );
    };

    const logout = () => {
        logoutAction();
        setCurrentUser(null);
        setIsAuthenticated(false);
        router.push(routes.auth.signin)

    }

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
        currentUser,
        isAuthenticated,
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
