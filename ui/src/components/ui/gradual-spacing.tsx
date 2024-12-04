"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";

import { cn } from "@/lib/utils";

interface GradualSpacingProps {
  text: string;
  duration?: number;
  delayMultiple?: number;
  wordDelayMultiple?: number; // Additional delay between words
  framerProps?: Variants;
  className?: string;
}

export default function GradualSpacing({
  text,
  duration = 0.5,
  delayMultiple = 0.04,
  wordDelayMultiple = 0.2,
  framerProps = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  className,
}: GradualSpacingProps) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      <AnimatePresence>
        {text.split(" ").map((word, wordIndex) => (
          <span key={wordIndex} className="flex">
            {word.split("").map((char, charIndex) => (
              <motion.span
                key={`${wordIndex}-${charIndex}`}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={framerProps}
                transition={{
                  duration,
                  delay:
                    wordIndex * wordDelayMultiple + // Delay for previous words
                    charIndex * delayMultiple, // Delay for letters within the current word
                }}
                className={cn("inline-block", className)}
              >
                {char}
              </motion.span>
            ))}
            <span>&nbsp;</span>
          </span>
        ))}
      </AnimatePresence>
    </div>
  );
}
