type EventValue = string | number | boolean;
type EventParams = Record<string, EventValue | null | undefined>;

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: string,
      eventParams?: Record<string, EventValue>,
    ) => void;
  }
}

function normalizeParams(params?: EventParams): Record<string, EventValue> | undefined {
  if (!params) {
    return undefined;
  }

  const normalized: Record<string, EventValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      normalized[key] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function trackEvent(eventName: string, params?: EventParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, normalizeParams(params));
}

