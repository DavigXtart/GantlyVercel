// Umami custom event tracking (privacy-friendly, GDPR compliant)
export const trackEvent = (eventName: string, data?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && (window as any).umami) {
    (window as any).umami.track(eventName, data);
  }
};
