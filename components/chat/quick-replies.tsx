"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickRepliesProps {
  replies: string[];
  disabled?: boolean;
  onSelect: (message: string) => void;
}

export function QuickReplies({ replies, disabled, onSelect }: QuickRepliesProps) {
  if (replies.length === 0) return null;

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5",
        "snap-x snap-mandatory scroll-smooth",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(reply)}
          className={cn(
            "shrink-0 snap-start transition-colors",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <Badge
            variant="secondary"
            className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-[11px] font-normal sm:text-xs"
          >
            {reply}
          </Badge>
        </button>
      ))}
    </div>
  );
}