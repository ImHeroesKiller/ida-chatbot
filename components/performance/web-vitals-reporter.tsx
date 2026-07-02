"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

type VitalPayload = {
  name: Metric["name"];
  value: number;
  rating: Metric["rating"];
  id: string;
  path: string;
};

function formatMetricValue(metric: Metric): string {
  return metric.name === "CLS"
    ? metric.value.toFixed(3)
    : `${Math.round(metric.value)}ms`;
}

function reportMetric(metric: Metric) {
  const payload: VitalPayload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    path:
      typeof window !== "undefined"
        ? window.location.pathname
        : "/",
  };

  const formatted = formatMetricValue(metric);

  if (process.env.NODE_ENV === "development") {
    console.info(`[IDA CWV] ${metric.name}: ${formatted} (${metric.rating})`);
  } else {
    console.info(
      `[IDA CWV] ${payload.path} ${metric.name}: ${formatted} (${metric.rating})`,
    );
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("ida:web-vital", {
        detail: payload,
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