import { useMotionTemplate, useMotionValue } from "framer-motion";
import React, { useState } from "react";

export function useRadialHoverEffect(radius = 100) {
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: any) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useMotionTemplate`
    radial-gradient(
      ${visible ? `${radius}px` : "0px"} circle at ${mouseX}px ${mouseY}px,
      hsl(var(--primary)),
      transparent 80%
    )
  `;

  return {
    background,
    handleMouseMove,
    handleMouseEnter: () => setVisible(true),
    handleMouseLeave: () => setVisible(false),
  };
}
