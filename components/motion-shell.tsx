"use client";

import type { ReactNode } from "react";
import { LayoutGroup, MotionConfig } from "framer-motion";

export function MotionShell({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id="rak-bersama">{children}</LayoutGroup>
    </MotionConfig>
  );
}
