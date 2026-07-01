"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { slideInRight } from "@/lib/ui/motion-presets";
import { cn } from "@/lib/utils";

interface DesktopToolPanelProps {
  children: ReactNode;
  className?: string;
}

/** Animated slide-in wrapper for desktop right tool panels. */
export function DesktopToolPanel({ children, className }: DesktopToolPanelProps) {
  return (
    <motion.div
      {...slideInRight}
      className={cn(
        "ida-desktop-panel h-full min-h-0 shrink-0 overflow-hidden",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}