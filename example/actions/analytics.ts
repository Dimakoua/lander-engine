/**
 * Custom analytics action handlers — registered automatically by lander-engine
 * from the `actions/` directory.
 *
 * Usage in JSON config:
 *   { "type": "logEvent", "payload": { "event": "cta_clicked", "properties": { "step": "main" } } }
 *   { "type": "identify",  "payload": { "userId": "usr_123", "traits": { "plan": "pro" } } }
 */

export const logEvent = async (payload: {
  event: string;
  properties?: Record<string, any>;
}) => {
  const { event, properties = {} } = payload;

  // In production, replace this with your analytics provider:
  //   window.analytics?.track(event, properties);   // Segment
  //   window.gtag?.('event', event, properties);    // Google Analytics
  //   window.fbq?.('track', event, properties);     // Meta Pixel
  console.log(`[analytics] logEvent: ${event}`, properties);
};

export const identify = async (payload: {
  userId: string;
  traits?: Record<string, any>;
}) => {
  const { userId, traits = {} } = payload;

  // In production:
  //   window.analytics?.identify(userId, traits);  // Segment
  console.log(`[analytics] identify: ${userId}`, traits);
};
