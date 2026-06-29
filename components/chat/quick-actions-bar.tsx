"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionsBarProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActionsBar({
  actions,
  className,
}: QuickActionsBarProps) {
  if (actions.length === 0) return null;

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex gap-2 overflow-x-auto pb-2 px-2.5 sm:px-5 scrollbar-hide",
        className
      )}
    >
      {actions.map((action) => (
        <motion.button
          key={action.id}
          variants={itemVariants}
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium",
            "bg-muted/60 hover:bg-muted transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "whitespace-nowrap shrink-0",
            "active:scale-95 hover:scale-105 transition-transform"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="flex h-5 w-5 items-center justify-center text-foreground/70">
            {action.icon}
          </span>
          <span className="hidden sm:inline">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
