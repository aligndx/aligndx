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

  const circles = [
    { size: 'w-60 h-60', duration: 0.5, initialRotate: 0 },
    { size: 'w-40 h-40', duration: 0.4, initialRotate: 120 },
    { size: 'w-24 h-24', duration: 0.3, initialRotate: 240 },
  ];

  return (
    isMounted && (
      <div
        className="relative flex justify-center items-center h-screen w-screen"
        {...props}
      >
        {circles.map((circle, index) => (
          <m.div
            key={index}
            className={`absolute border-4 border-muted/0 border-t-primary/25 border-solid rounded-full ${circle.size}`}
            initial={{
              rotate: circle.initialRotate,
            }}
            animate={{
              rotate: 360 + circle.initialRotate,
            }}
            transition={{
              duration: circle.duration,
              ease: 'linear',
              repeat: Infinity,
            }}
          />
        ))}
        <div className="absolute flex justify-center items-center">
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
      </div>
    )
  );
}
