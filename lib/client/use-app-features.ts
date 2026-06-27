"use client";

import { useEffect, useState } from "react";

import {
  fetchAppFeatures,
  type AppFeaturesResponse,
} from "@/lib/client/features";

export function useAppFeatures(): AppFeaturesResponse | null {
  const [features, setFeatures] = useState<AppFeaturesResponse | null>(null);

  useEffect(() => {
    void fetchAppFeatures().then(setFeatures);
  }, []);

  return features;
}