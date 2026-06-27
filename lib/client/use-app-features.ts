"use client";

import { useEffect, useState } from "react";

import { fetchAppFeatures, type AppFeatures } from "@/lib/client/features";

export function useAppFeatures(): AppFeatures | null {
  const [features, setFeatures] = useState<AppFeatures | null>(null);

  useEffect(() => {
    void fetchAppFeatures().then(setFeatures);
  }, []);

  return features;
}