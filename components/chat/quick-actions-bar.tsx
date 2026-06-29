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
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex gap-3 overflow-x-auto pb-3 px-4 sm:px-5 scrollbar-hide",
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
            "flex items-center gap-2.5 rounded-2xl px-5 py-3 text-base font-semibold",
            "bg-muted/40 hover:bg-muted border border-border/40 transition-all duration-200",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "whitespace-nowrap shrink-0 shadow-sm",
            "active:scale-95"
          )}
          whileTap={{ scale: 0.96 }}
        >
          <span className="flex h-5 w-5 items-center justify-center text-primary/80">
            {action.icon}
          </span>
          <span>{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
