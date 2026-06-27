import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/ida-logo.png";

export interface IdaLogoProps {
  size?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  alt?: string;
}

export function IdaLogo({
  size = 32,
  className,
  imageClassName,
  priority = false,
  alt = "IDA",
}: IdaLogoProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/5 ring-1 ring-primary/15 dark:bg-primary/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={LOGO_SRC}
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className={cn("size-full object-cover", imageClassName)}
      />
    </span>
  );
}