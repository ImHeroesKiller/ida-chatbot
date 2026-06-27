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
  { className: string; px: number }
> = {
  xs: { className: "size-7", px: 28 },
  sm: { className: "size-8", px: 32 },
  md: { className: "size-9", px: 36 },
  lg: { className: "size-10", px: 40 },
  xl: { className: "size-16", px: 64 },
  header: { className: "size-9 sm:size-10", px: 40 },
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
        priority={priority}
        className={cn("size-full object-contain", imageClassName)}
      />
    </span>
  );
}