"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

import { ChatProvider } from "@/components/chat/chat-provider";
import { ChatWindow } from "@/components/chat/chat-window";
import { COPY } from "@/lib/i18n";
import type { Locale } from "@/lib/config";
import { cn } from "@/lib/utils";

interface FloatingChatProps {
  defaultLocale?: Locale;
}

function FloatingChatInner({ defaultLocale = "id" }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const copy = COPY[defaultLocale];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            className="pointer-events-none fixed inset-0 z-50 sm:pointer-events-none"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? copy.close : copy.open}
        aria-expanded={isOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors",
          "bottom-[calc(5rem+env(safe-area-inset-bottom))] right-3 sm:bottom-6 sm:right-5",
          isOpen
            ? "bg-muted text-foreground ring-1 ring-border"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-7 w-7" />
        )}
      </motion.button>
    </>
  );
}

export function FloatingChat({ defaultLocale = "id" }: FloatingChatProps) {
  return (
    <ChatProvider defaultLocale={defaultLocale}>
      <FloatingChatInner defaultLocale={defaultLocale} />
    </ChatProvider>
  );
}