'use client'
import { m } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import Logo from '@/components/logo';

interface SplashScreenProps extends React.HTMLAttributes<HTMLDivElement> { }

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
        className="flex justify-center items-center h-screen w-screen "
        {...props}
      >
        <m.div
          animate={{
            scale: [1, 0.9, 0.9, 1, 1],
            opacity: [1, 0.48, 0.48, 1, 1],
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            repeatDelay: 1,
            repeat: Infinity,
          }}
        >
          <Logo full={false} />
        </m.div>
      </div>
    )
  );
}
