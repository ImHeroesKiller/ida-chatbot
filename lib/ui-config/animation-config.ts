/**
 * Animation Configuration for Mobile Redesign
 * Centralized configuration for smooth animations and transitions
 */

export const ANIMATION_CONFIG = {
  // Timing configurations
  timing: {
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
    verySlow: 0.5,
  },

  // Easing functions
  easing: {
    easeOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    linear: "linear",
  },

  // Header animations
  header: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },

  // Composer animations
  composer: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: "easeOut" },
  },

  // Quick actions animations
  quickActions: {
    container: {
      hidden: { opacity: 0, y: 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: "easeOut",
          staggerChildren: 0.05,
        },
      },
    },
    item: {
      hidden: { opacity: 0, scale: 0.92 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.2, ease: "easeOut" },
      },
    },
  },

  // Button animations
  button: {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    transition: { duration: 0.2, ease: "easeOut" },
  },

  // Status message animations
  statusMessage: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.2 },
  },

  // Message bubble animations
  messageBubble: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },

  // Backdrop blur effect
  backdrop: {
    blur: "blur(4px)",
    webkitBlur: "blur(4px)",
  },

  // Responsive adjustments
  responsive: {
    mobile: {
      duration: 0.15, // Faster animations on mobile
    },
    tablet: {
      duration: 0.2,
    },
    desktop: {
      duration: 0.3,
    },
  },
} as const;

/**
 * Get animation config based on screen size
 */
export function getResponsiveAnimationDuration(
  screenWidth: number
): number {
  if (screenWidth < 640) {
    return ANIMATION_CONFIG.responsive.mobile.duration;
  } else if (screenWidth < 1024) {
    return ANIMATION_CONFIG.responsive.tablet.duration;
  }
  return ANIMATION_CONFIG.responsive.desktop.duration;
}

/**
 * Combine animation configs
 */
export function mergeAnimationConfig(
  base: Record<string, any>,
  override: Record<string, any>
) {
  return {
    ...base,
    ...override,
    transition: {
      ...base.transition,
      ...override.transition,
    },
  };
}

/**
 * Create staggered animation for list items
 */
export function createStaggerAnimation(
  itemCount: number,
  delay: number = 0.05
) {
  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: delay,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.2 },
      },
    },
  };
}

/**
 * Reduced motion query hook helper
 */
export const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get safe animation config respecting user preferences
 */
export function getSafeAnimationConfig(
  config: Record<string, any>
): Record<string, any> {
  if (prefersReducedMotion()) {
    return {
      ...config,
      transition: {
        ...config.transition,
        duration: 0.01,
      },
    };
  }
  return config;
}
