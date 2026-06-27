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
    <div className="flex flex-wrap gap-1.5">
      {replies.map((reply, index) => {
        const isHandoff = index === replies.length - 1;

        return (
          <button
            key={reply}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(isHandoff ? "" : reply, isHandoff)}
            className={cn(
              "transition-colors disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <Badge
              variant={isHandoff ? "default" : "secondary"}
              className={cn(
                "cursor-pointer px-2.5 py-1 text-[10px] font-normal",
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