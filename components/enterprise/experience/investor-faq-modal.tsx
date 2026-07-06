"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, X } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

import { useEnterprise } from "./enterprise-context";
import { INVESTOR_FAQ } from "./narrative";

export function InvestorFaqTrigger() {
  const { openFaq } = useEnterprise();
  return (
    <button
      type="button"
      onClick={() => openFaq()}
      className="hidden items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground sm:inline-flex"
    >
      <HelpCircle className="size-3.5" />
      Investor FAQ
    </button>
  );
}

export function InvestorFaqModal() {
  const { faqOpen, closeFaq } = useEnterprise();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFaq();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeFaq]);

  return (
    <AnimatePresence>
      {faqOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-background/70 p-4 pt-[10vh] backdrop-blur-md sm:p-8"
          onClick={closeFaq}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="enterprise-card-premium w-full max-w-2xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">Investor FAQ</h2>
                <p className="text-xs text-muted-foreground">Short answers to the questions investors ask most.</p>
              </div>
              <button
                type="button"
                onClick={closeFaq}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="enterprise-demo-scroll max-h-[60vh] divide-y divide-border/30 p-2">
              {INVESTOR_FAQ.map((item) => (
                <details key={item.id} className="group px-3 py-3">
                  <summary
                    className={cn(
                      "cursor-pointer list-none text-sm font-medium leading-snug transition-colors",
                      "marker:content-none [&::-webkit-details-marker]:hidden",
                      "group-open:text-primary",
                    )}
                  >
                    {item.question}
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}