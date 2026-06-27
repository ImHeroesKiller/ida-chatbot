"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

function reportMetric(metric: Metric) {
  const value =
    metric.name === "CLS"
      ? metric.value.toFixed(3)
      : `${Math.round(metric.value)}ms`;

  if (process.env.NODE_ENV === "development") {
    console.info(`[IDA CWV] ${metric.name}: ${value} (${metric.rating})`);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("ida:web-vital", {
        detail: {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
        },
      }),
    );
  }
}

export function WebVitalsReporter() {
  useEffect(() => {
    onCLS(reportMetric);
    onINP(reportMetric);
    onLCP(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
  }, []);

  return null;
}