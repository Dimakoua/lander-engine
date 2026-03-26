// routing.config.js — Domain-to-campaign mapping
// Maps each production hostname to a campaign ID (folder name inside json_configs/).
//
// At build time, lander-engine reads each campaign's flow.json to resolve the
// initialStep, then generates:
//   - src/pages/index.astro  — universal client-side redirect (any static host)
//   - public/_redirects      — Netlify edge redirect rules
//   - public/vercel.json     — Vercel edge redirect rules
//
// https://github.com/your-org/lander-engine#domain-routing

export default {
  // 'your-domain.com': 'campaign_alpha',
  // 'www.your-domain.com': 'campaign_alpha',
  //
  // Add one entry per hostname. The value must match a folder name in json_configs/.
  // Example:
  //   'promo.example.com': 'campaign_alpha',
  //   'sale.example.com':  'campaign_beta',

  'localhost': 'campaign_alpha',
};
