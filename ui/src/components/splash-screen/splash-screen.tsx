'use client'
import { m } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import Logo from '@/components/logo';

interface SplashScreenProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function SplashScreen({ ...props }: SplashScreenProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const handleMount = () => {
      setIsMounted(true);
    };

    handleMount();
  }, []);

  return (
    isMounted && (
      <div
        className="flex justify-center items-center h-screen w-screen"
        {...props}
      >
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Logo />
        </m.div>
      </div>
    )
  );
}
