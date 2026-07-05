# Domain Routing & Hosting


Map custom domains to specific campaigns, optionally specifying a renderFromRoot option and defaultStep, by creating a `routing.config.js` in your project root. At build time, Lander reads each campaign's `flow.json` to resolve the `initialStep`, then generates three routing artifacts targeting different static hosts.

```js
// routing.config.js
export default {
  // Simple mapping (equivalent to previous behavior)
  'campaign-a.com':     'campaign_alpha',
  // Mapping with rendering from root – no campaign prefix in the root URL (uses 200 rewrites)
  'example.com':        { campaign: 'campaign_alpha', renderFromRoot: true },
  // Mapping with a custom default step instead of the flow's initialStep
  'beta.example.com':   { campaign: 'campaign_beta', defaultStep: 'landing' },
};
```

Each key is a hostname (no scheme, no trailing slash). The value can be a string (campaign ID) for the default behavior, or an object to specify additional options:
- `campaign` (required): the campaign folder name inside `json_configs/`.
- `renderFromRoot` (optional): boolean. If true, the initial page will render directly at the root `/` of that domain (using CDN/browser rewrites). All other steps will reside at `/campaignId/stepId`.
- `defaultStep` (optional): overrides the `initialStep` from the campaign's `flow.json`.

### Generated artifacts

Running `lander build` with a `routing.config.js` present produces three files inside `.lander-engine/`:

| File | Purpose |
|---|---|
| `src/pages/index.astro` | Universal client-side redirect. Reads `window.location.hostname` and redirects to the campaign path. Works on **any** static host with no server configuration. |
| `public/_redirects` | [Netlify](https://docs.netlify.com/routing/redirects/redirect-options/) host-based redirect rules. Faster than client-side — handled at the CDN edge. |
| `public/vercel.json` | [Vercel](https://vercel.com/docs/projects/project-configuration#redirects) host-based redirect rules with `has.type=host` conditions. |

### Redirect target

Each domain redirects to `/{campaignId}/{initialStep}` where `initialStep` comes from that campaign's `flow.json`. Query strings (`?utm_source=...`) are preserved.

```
campaign-a.com  →  302  /campaign_alpha/main
campaign-b.com  →  302  /campaign_beta/landing
```

### Priority

The three artifacts work at different layers:

1. **Netlify / Vercel** — platform redirect rules fire before the page is served (recommended for production).
2. **`index.astro`** — client-side JS fallback. Used automatically when deploying to hosts that don't support server redirect rules (GitHub Pages, S3, bare CDN).

For production deployments, prefer Netlify or Vercel so the redirect is edge-handled and JavaScript-independent.

### No `routing.config.js`

If the file is absent, none of the routing artifacts are generated and the behaviour is unchanged — campaigns are only accessible via their full paths (`/{campaignId}/{stepId}`).

---
