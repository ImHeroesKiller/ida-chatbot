"use client";

import type { ReactNode } from "react";

import type { EntityType } from "./types";
import { useEnterprise } from "./enterprise-context";
import { cn } from "@/lib/utils";

type EntityLinkProps = {
  type: EntityType;
  id: string;
  children: ReactNode;
  className?: string;
};

export function EntityLink({ type, id, children, className }: EntityLinkProps) {
  const { navigateToEntity } = useEnterprise();

  return (
    <button
      type="button"
      onClick={() => navigateToEntity(type, id)}
      className={cn(
        "text-left font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline",
        className,
      )}
    >
      {children}
    </button>
  );
}