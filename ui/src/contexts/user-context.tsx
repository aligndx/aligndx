'use client'

import React, { createContext, ReactNode } from 'react';

export const UserContext = createContext<null>(null);

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
    return (
        <UserContext.Provider value={null}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
