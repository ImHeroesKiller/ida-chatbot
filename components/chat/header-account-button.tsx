"use client";

import Link from "next/link";
import { User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderAccountButtonProps {
  label: string;
  displayName?: string;
  avatarUrl?: string;
  loading?: boolean;
  href?: string;
  className?: string;
}

function buildInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function HeaderAccountButton({
  label,
  displayName,
  avatarUrl,
  loading = false,
  href = "/account",
  className,
}: HeaderAccountButtonProps) {
  const name = displayName?.trim() || label;
  const initials = buildInitials(name);

  return (
    <Link
      href={href}
      aria-label={label}
      title={name}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "h-10 w-10 shrink-0 sm:h-9 sm:w-auto sm:gap-2 sm:px-2.5",
        className,
      )}
    >
      {loading ? (
        <span className="size-6 animate-pulse rounded-full bg-muted sm:size-7" />
      ) : displayName ? (
        <>
          <Avatar className="size-6 sm:size-7">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} />
            ) : null}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[7rem] truncate text-xs font-medium sm:inline">
            {displayName}
          </span>
        </>
      ) : (
        <User className="size-4" />
      )}
    </Link>
  );
}