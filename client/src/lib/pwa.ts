export function registerPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed, app still works
      console.log('PWA not supported in this environment');
    });
  }
}

export function trackEvent(eventName: string, eventData?: Record<string, any>) {
  try {
    const events = JSON.parse(localStorage.getItem('choiceProperties_analytics') || '[]');
    events.push({
      name: eventName,
      timestamp: new Date().toISOString(),
      data: eventData || {}
    });
    // Keep only last 100 events
    localStorage.setItem('choiceProperties_analytics', JSON.stringify(events.slice(-100)));

    // Also send to Google Analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', eventName, eventData);
    }
  } catch (e) {
    // Silently fail
  }
}

export function trackFormCompletion(formName: string, success: boolean) {
  trackEvent('form_submission', {
    form: formName,
    success,
    timestamp: new Date().toISOString()
  });
}
