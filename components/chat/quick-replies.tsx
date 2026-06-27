"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickRepliesProps {
  replies: string[];
  disabled?: boolean;
  onSelect: (message: string, isHandoff?: boolean) => void;
  handoffLabel: string;
}

export function QuickReplies({
  replies,
  disabled,
  onSelect,
  handoffLabel,
}: QuickRepliesProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5",
        "snap-x snap-mandatory scroll-smooth",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {replies.map((reply, index) => {
        const isHandoff = index === replies.length - 1;

        return (
          <button
            key={reply}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(isHandoff ? "" : reply, isHandoff)}
            className={cn(
              "shrink-0 snap-start transition-colors",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <Badge
              variant={isHandoff ? "default" : "secondary"}
              className={cn(
                "cursor-pointer whitespace-nowrap px-3 py-1.5 text-[11px] font-normal sm:text-xs",
                isHandoff && "bg-primary/90 hover:bg-primary",
              )}
            >
              {isHandoff ? handoffLabel : reply}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}