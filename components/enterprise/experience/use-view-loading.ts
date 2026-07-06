"use client";

import { useEffect, useState } from "react";

import { useEnterprise } from "./enterprise-context";

const LOADING_MS = 380;

export function useViewLoading() {
  const { view, entityId, memoryTab } = useEnterprise();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), LOADING_MS);
    return () => window.clearTimeout(timer);
  }, [view, entityId, memoryTab]);

  return loading;
}