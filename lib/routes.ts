import type { Locale } from '@/i18n/routing';

/**
 * Centralized route definitions for IDA.
 * All application routes should be referenced from here.
 * This ensures consistency and makes future refactors safer.
 */

export const routes = {
  // Public routes
  landing: (locale: Locale) => `/${locale}`,
  demo: (locale: Locale) => `/${locale}/demo`,
  enterprise: (locale: Locale) => `/${locale}/enterprise`,
  enterpriseEsl: (locale: Locale) => `/${locale}/enterprise/esl`,

  // Protected routes
  chat: (locale: Locale) => `/${locale}/chat`,
  recruitment: (locale: Locale) => `/${locale}/recruitment`,
  recruitmentDetail: (locale: Locale, decisionId: string) => 
    `/${locale}/recruitment/${decisionId}`,

  // Admin
  admin: (locale: Locale) => `/${locale}/admin`,

  // Auth related (if needed)
  login: (locale: Locale) => `/${locale}/login`,
  callback: (locale: Locale) => `/${locale}/auth/callback`,
} as const;

// Type-safe route keys
export type AppRoute = keyof typeof routes;

// Helper to get all public routes
export const publicRoutes = [
  routes.landing,
  routes.demo,
  routes.enterprise,
  routes.enterpriseEsl,
] as const;