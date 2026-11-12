"use client";

import { MotionConfig } from "motion/react";

/** Motion defaults for pages that animate lists; respects prefers-reduced-motion. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </MotionConfig>
  );
}
