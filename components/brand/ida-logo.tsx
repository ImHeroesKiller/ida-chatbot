import Image from "next/image";
import type React from "react";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/ida-logo.png";

export type IdaLogoSize =
  | number
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "header";

const PRESET_SIZES: Record<
  Exclude<IdaLogoSize, number>,
  { className: string; px: number; sizes: string }
> = {
  xs: { className: "size-7", px: 28, sizes: "28px" },
  sm: { className: "size-8", px: 32, sizes: "32px" },
  md: { className: "size-9", px: 36, sizes: "36px" },
  lg: { className: "size-10", px: 40, sizes: "40px" },
  xl: { className: "size-16", px: 64, sizes: "64px" },
  header: { className: "size-9 sm:size-10", px: 40, sizes: "(max-width: 640px) 36px, 40px" },
};

export interface IdaLogoProps
  extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  size?: IdaLogoSize;
  variant?: "brand" | "avatar";
  imageClassName?: string;
  priority?: boolean;
  alt?: string;
}

export function IdaLogo({
  size = "md",
  variant = "brand",
  className,
  imageClassName,
  priority = false,
  alt = "IDA",
  ...props
}: IdaLogoProps) {
  const preset = typeof size === "string" ? PRESET_SIZES[size] : null;
  const px = typeof size === "number" ? size : preset!.px;
  const sizes = preset?.sizes ?? `${px}px`;

  return (
    <span
      {...props}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        variant === "brand" ? "rounded-2xl" : "rounded-xl",
        preset?.className,
        className,
      )}
      style={
        typeof size === "number"
          ? { width: size, height: size }
          : undefined
      }
    >
      <Image
        src={LOGO_SRC}
        alt={alt}
        width={px}
        height={px}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("size-full object-contain", imageClassName)}
      />
    </span>
  );
}