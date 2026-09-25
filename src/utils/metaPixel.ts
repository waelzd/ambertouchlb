export const META_PIXEL_ID = '1621730865964641';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const initMetaPixel = (): void => {
  if (window.fbq) return; // already loaded

  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq!('init', META_PIXEL_ID);
  // PageView is fired by the PixelRouteTracker in App.tsx
};

export const trackEvent = (
  eventName: string,
  data: Record<string, unknown> = {}
): void => {
  if (window.fbq) {
    window.fbq('track', eventName, data);
  } else {
    console.warn('Meta Pixel not loaded yet:', eventName);
  }
};

export const trackPageView = (): void => trackEvent('PageView');

export const trackViewContent = (product: {
  id: string;
  name: string;
  price: number;
}): void =>
  trackEvent('ViewContent', {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'USD',
  });

export const trackAddToCart = (
  product: { id: string; name: string; price: number },
  quantity = 1
): void =>
  trackEvent('AddToCart', {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price * quantity,
    currency: 'USD',
  });

export const trackInitiateCheckout = (
  total: number,
  items: { id: string }[]
): void =>
  trackEvent('InitiateCheckout', {
    value: total,
    currency: 'USD',
    num_items: items.length,
    content_ids: items.map((i) => i.id),
    content_type: 'product',
  });

export const trackPurchase = (total: number, items: { id: string }[]): void =>
  trackEvent('Purchase', {
    value: total,
    currency: 'USD',
    content_ids: items.map((i) => i.id),
    content_type: 'product',
  });

export const trackLead = (): void => trackEvent('Lead');