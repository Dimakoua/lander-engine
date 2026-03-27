# lander-engine

> Configuration-driven JAMstack landing page meta-framework. Build multi-step campaign flows, A/B tests, and device-targeted experiences using pure JSON — no custom routing code required.

[![npm version](https://img.shields.io/npm/v/lander-engine)](https://www.npmjs.com/package/lander-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration Reference](#configuration-reference)
  - [flow.json](#flowjson)
  - [theme.json](#themejson)
  - [layout.json](#layoutjson)
  - [steps/\*.json](#stepsjson)
- [Cascading Override System](#cascading-override-system)
- [Action Dispatcher](#action-dispatcher)
  - [setState](#setstate)
  - [toggleState](#togglestate)
  - [rest](#rest)
  - [navigation](#navigation)
  - [sequence](#sequence)
  - [conditional](#conditional)
  - [ui](#ui)
- [Runtime Core API](#runtime-core-api)
  - [State](#state)
  - [Dispatcher](#dispatcher)
  - [Loading State](#loading-state)
  - [Registry](#registry)
- [Writing Components](#writing-components)
- [Custom Actions](#custom-actions)
- [Plugin API](#plugin-api)
- [Domain Routing](#domain-routing)
- [CLI](#cli)
- [TypeScript Reference](#typescript-reference)
- [Deployment](#deployment)

---

## Overview

`lander-engine` generates a fully static Astro site from your JSON campaign configurations. Each campaign is a folder of JSON files that describe routing, theme tokens, layout, and the component tree for each step — no template code required.

**Key features:**

- **Zero-JS by Default** — outputs static HTML; client-side JavaScript is loaded only for interactive React/Vue/Svelte Islands.
- **Configuration-Driven** — entire campaign structure, theming, and interactivity is defined in JSON.
- **Cascading Overrides** — layered merge system supports device-specific (mobile/desktop) and A/B variant overrides at any config level.
- **Action Dispatcher** — declarative, framework-agnostic event bus for state mutations, API calls, navigation, and UI operations — all from JSON.
- **Auto-Discovery** — components and custom action handlers are registered automatically from your project directories.
- **Popup/Modal Steps** — first-class support for overlay steps with per-popup styling configuration.

**Built on:** [Astro](https://astro.build) · [Nanostores](https://github.com/nanostores/nanostores) · [Tailwind CSS](https://tailwindcss.com)

---

## Installation

```bash
npm install lander-engine
```

**Peer dependencies / runtime requirements:**
- Node.js 20+
- Astro 4+ (installed as a dependency)

---

## Quick Start

```bash
# 1. Create project directories
mkdir my-campaign && cd my-campaign
mkdir components json_configs actions

# 2. Create a minimal configuration
mkdir -p json_configs/my-campaign/steps

# 3. Add lander.config.js
cat > lander.config.js << 'EOF'
export default {};
EOF

# 4. Run the dev server
npx lander dev
```

After running `lander dev`, Lander generates a hidden `.lander-engine/` workspace and starts an Astro dev server. Your campaign is served at `http://localhost:4321/my-campaign/main`.

---

## Project Structure

```text
my-project/
├── components/                  # UI components (React, Astro, Vue, Svelte)
│   ├── Hero.tsx
│   └── Footer.astro
├── actions/                     # Custom action handlers
│   └── myActions.ts
├── json_configs/                # Campaign configurations
│   └── campaign_alpha/
│       ├── flow.json            # Step routing and modal definitions
│       ├── theme.json           # Design tokens (colors, spacing, etc.)
│       ├── layout.json          # Header / footer component bindings
│       ├── seo.json             # Global SEO defaults (optional)
│       ├── state.json           # Initial global state (optional)
│       ├── steps/               # One JSON file per step/page
│       │   ├── main.json
│       │   ├── checkout.json
│       │   └── thanks.json
│       └── mobile/              # Mobile overrides (optional)
│           ├── theme.json
│           ├── layout.json
│           └── steps/
│               └── main.json
├── lander.config.js             # Engine configuration (optional)
└── routing.config.js            # Domain → campaign mapping (optional)
```

**Generated output** (do not commit):

```text
.lander-engine/                  # Managed Astro workspace — auto-generated
dist/                            # Final static HTML output after `lander build`
```

---

## Configuration Reference

### `flow.json`

Defines the steps in your campaign and their routing relationships.

```json
{
  "initialStep": "main",
  "steps": {
    "main":         { "type": "normal" },
    "checkout":     { "type": "normal" },
    "thanks":       { "type": "normal" },
    "contact-form": { "type": "popup" }
  },
  "modals": {
    "contact-form": {
      "backgroundColor":     "#ffffff",
      "backdropColor":       "rgb(0, 0, 0)",
      "backdropOpacity":     0.6,
      "borderRadius":        "12px",
      "maxWidth":            "800px",
      "width":               "95%",
      "maxHeight":           "75vh",
      "padding":             "2.5rem",
      "boxShadow":           "0 20px 60px rgba(0,0,0,0.4)",
      "closeOnBackdropClick": true
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `initialStep` | `string` | Yes | The step ID to use as the campaign entry point |
| `steps` | `object` | Yes | Map of step IDs to step definitions |
| `steps[id].type` | `"normal"` \| `"popup"` | Yes | `normal` = full page; `popup` = rendered as a hidden modal overlay |
| `modals` | `object` | No | Per-popup styling, keyed by the popup step ID |

**Modal config fields:**

| Field | Type | Default | Description |
|---|---|---|---|
| `backgroundColor` | `string` | `#ffffff` | Modal background color |
| `backdropColor` | `string` | — | Backdrop color (any CSS value) |
| `backdropOpacity` | `number` | `0.5` | Backdrop opacity (0–1) |
| `borderRadius` | `string` | — | CSS border-radius |
| `maxWidth` / `width` | `string` | — | CSS size values |
| `maxHeight` | `string` | — | CSS max-height |
| `padding` | `string` | — | CSS padding |
| `boxShadow` | `string` | — | CSS box-shadow |
| `closeOnBackdropClick` | `boolean` | — | Close modal when clicking outside it |
| `animation` | `"fade"` \| `"scale"` \| `"slide"` \| `"none"` | — | Entry animation |
| `animationDuration` | `number` | — | Animation duration in milliseconds |

---

### `theme.json`

Defines design tokens that are injected into the page as CSS custom properties on `<html>`.

```json
{
  "colors": {
    "primary":    "#3b82f6",
    "secondary":  "#1e293b",
    "background": "#ffffff",
    "text":       "#0b0c10"
  },
  "fonts": {
    "body": "Inter, sans-serif"
  },
  "tokens": {
    "buttonRadius": "12px",
    "cardShadow":   "0 4px 24px rgba(0,0,0,0.08)"
  },
  "favicon": "/assets/campaign-a-icon.svg"
}
```

**CSS variable mapping:**

| JSON path | CSS variable |
|---|---|
| `colors.primary` | `--color-primary` |
| `colors.secondary` | `--color-secondary` |
| `colors.background` | `--color-background` |
| `tokens.buttonRadius` | `--token-buttonRadius` |

Use these in your components and Tailwind classes:

```tsx
// In a component
<h1 className="text-[var(--color-primary)]">Hello</h1>
<button style={{ borderRadius: 'var(--token-buttonRadius)' }}>Click</button>
```

| Field | Type | Required | Description |
|---|---|---|---|
| `colors` | `Record<string, string>` | Yes | Color palette |
| `fonts` | `Record<string, string>` | No | Font stack definitions |
| `spacing` | `Record<string, string>` | No | Spacing scale |
| `borderRadius` | `Record<string, string>` | No | Border-radius scale |
| `tokens` | `Record<string, any>` | No | Arbitrary named design tokens |
| `favicon` | `string` | No | Favicon URL (root-relative or absolute). Supported formats: `.svg`, `.ico`, `.png`, `.jpg`, `.webp`. Falls back to `/favicon.svg`. |

---

### `layout.json`

Binds components to the header and footer slots and injects third-party scripts.

```json
{
  "header": {
    "component": "SiteHeader",
    "props": { "logoText": "My Brand" }
  },
  "footer": {
    "component": "SiteFooter",
    "props": {}
  },
  "scripts": [
    {
      "src":      "https://www.googletagmanager.com/gtag/js?id=G-XXXX",
      "async":    true,
      "position": "head"
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `header.component` | `string` | Registered component name for the header |
| `header.props` | `object` | Props passed to the header component |
| `footer.component` | `string` | Registered component name for the footer |
| `scripts` | `array` | External scripts to inject |
| `scripts[].src` | `string` | Script URL |
| `scripts[].async` / `defer` | `boolean` | Script loading attributes |
| `scripts[].position` | `"head"` \| `"body-start"` \| `"body-end"` | Where to inject the script tag |

---

### `steps/*.json`

Each file in `steps/` defines one page/step in your campaign. The filename (without `.json`) is the step ID.

```json
{
  "sections": [
    {
      "component": "Hero",
      "props": {
        "title":    "Build Better Landing Pages",
        "subtitle": "Configuration-driven and fast.",
        "ctaText":  "Get Started",
        "onCtaClick": [
          {
            "type": "navigation",
            "payload": { "to": "checkout", "type": "step" }
          }
        ]
      }
    },
    {
      "component": "Features",
      "props": {
        "features": [
          { "icon": "⚡", "title": "Fast", "description": "Static HTML output." }
        ]
      }
    }
  ],
  "seo": {
    "title":       "Welcome | My Campaign",
    "description": "Build high-performance landing pages.",
    "ogImage":     "https://example.com/og.png",
    "noindex":     false
  },
  "state": {
    "userSegment": "default"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `sections` | `array` | Yes | Ordered list of component sections to render on this step |
| `sections[].component` | `string` | Yes | Name of the registered component |
| `sections[].props` | `object` | No | Props to pass to the component |
| `sections[].renderIf` | `string` | No | State key or JS expression; section is skipped if falsy |
| `seo.title` | `string` | No | Page `<title>` |
| `seo.description` | `string` | No | Meta description |
| `seo.keywords` | `string[]` | No | Meta keywords |
| `seo.ogImage` | `string` | No | Open Graph image URL |
| `seo.canonical` | `string` | No | Canonical URL |
| `seo.noindex` | `boolean` | No | Set meta robots noindex |
| `state` | `object` | No | Key/value pairs hydrated into global state when this step loads |

---

## Cascading Override System

Lander merges configuration files in priority order, allowing you to override any config at the device or variant level without duplicating the full base configuration.

**Merge priority (lowest → highest):**

```
Base  <  Device  <  Variant  <  Variant + Device
```

**Directory layout for overrides:**

```text
json_configs/campaign_alpha/
├── theme.json                         ← base
├── mobile/
│   └── theme.json                     ← device override (mobile)
├── variant_b/
│   └── theme.json                     ← variant override
└── variant_b/mobile/
    └── theme.json                     ← variant + device override (highest priority)
```

**Merge behavior:**
- Objects are recursively deep-merged.
- Arrays are **replaced entirely** — the higher-priority array wins, no concatenation.

**Mobile detection:** At runtime, the generated page includes a client-side script that detects the device type and redirects to the `.mobile` URL variant if a mobile config exists (e.g., `/campaign_alpha/main.mobile`).

---

## Action Dispatcher

Actions are the core of Lander's interactivity model. They are defined declaratively in JSON and dispatched by components via the `dispatcher` singleton. All action types can be nested and composed.

### `setState`

Set any key in the global state.

```json
{
  "type": "setState",
  "payload": {
    "key":   "hasAgreedToTerms",
    "value": true
  }
}
```

### `toggleState`

Flip a boolean value in state.

```json
{
  "type": "toggleState",
  "payload": { "key": "menuOpen" }
}
```

### `rest`

Make an HTTP request. Sets a loading flag automatically during the request.

```json
{
  "type": "rest",
  "payload": {
    "url":        "https://api.example.com/leads",
    "method":     "POST",
    "headers":    { "Authorization": "Bearer TOKEN" },
    "body":       { "email": "user@example.com" },
    "stateKey":   "leadResponse",
    "loadingKey": "isSubmitting",
    "onSuccess": [
      { "type": "navigation", "payload": { "to": "thanks", "type": "step" } }
    ],
    "onError": [
      { "type": "setState", "payload": { "key": "submitError", "value": true } }
    ]
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | — | **Required.** Request URL |
| `method` | `string` | `"GET"` | HTTP method |
| `headers` | `object` | — | Additional request headers (merged with `Content-Type: application/json`) |
| `body` | `object` | — | Request body (JSON-serialized) |
| `stateKey` | `string` | — | State key to store the JSON response |
| `loadingKey` | `string` | `loading_<stateKey>` | State key used as a loading flag |
| `onSuccess` | `Action[]` | — | Actions dispatched after a successful response |
| `onError` | `Action[]` | — | Actions dispatched after a failed request |

> **Loading state:** The dispatcher sets `loadingKey` to `true` before the fetch and `false` after (success or error). Use `watchLoadingAction` in your components to react to this.

### `navigation`

Navigate to another step or an external URL.

```json
{ "type": "navigation", "payload": { "to": "checkout", "type": "step" } }

{ "type": "navigation", "payload": { "to": "https://example.com", "type": "external", "replace": true } }
```

| Field | Type | Description |
|---|---|---|
| `to` | `string` | Step ID (for `type: "step"`) or full URL (for `type: "external"`) |
| `type` | `"step"` \| `"external"` | Navigation mode |
| `replace` | `boolean` | Use `location.replace()` instead of `href` assignment |

### `sequence`

Run multiple actions in order, waiting for each to complete.

```json
{
  "type": "sequence",
  "payload": {
    "actions": [
      { "type": "setState",  "payload": { "key": "step", "value": 2 } },
      { "type": "ui",        "payload": { "operation": "scrollTo", "params": { "top": 0 } } },
      { "type": "navigation","payload": { "to": "checkout", "type": "step" } }
    ]
  }
}
```

### `conditional`

Branch on a state key or JavaScript expression.

```json
{
  "type": "conditional",
  "payload": {
    "condition": "hasAgreedToTerms",
    "onTrue": [
      { "type": "navigation", "payload": { "to": "checkout", "type": "step" } }
    ],
    "onFalse": [
      { "type": "setState", "payload": { "key": "showTermsError", "value": true } }
    ]
  }
}
```

The `condition` field is first checked as a state key name. If no match is found, it is evaluated as a JavaScript expression with the current state in scope.

### `ui`

Trigger UI-level operations with no state side-effects.

**`scrollTo`** — Scroll the page.
```json
{ "type": "ui", "payload": { "operation": "scrollTo", "params": { "top": 0, "behavior": "smooth" } } }
```

**`copyToClipboard`** — Copy text to the clipboard.
```json
{ "type": "ui", "payload": { "operation": "copyToClipboard", "params": { "text": "Hello!" } } }
```

**`openPopup` / `closePopup`** — Show or hide a popup step.
```json
{ "type": "ui", "payload": { "operation": "openPopup",  "params": { "popupId": "contact-form" } } }
{ "type": "ui", "payload": { "operation": "closePopup", "params": { "popupId": "contact-form" } } }
```

**`goToNextStep`** — Navigate to another step within the current campaign (infers campaign ID from the URL).
```json
{ "type": "ui", "payload": { "operation": "goToNextStep", "params": { "next": "confirmation" } } }
```

---

## Runtime Core API

Import from `lander-engine/core` in your components.

### State

```ts
import { $state, hydrateState, setState, toggleState, getState } from 'lander-engine/core';
```

State is backed by a [Nanostores](https://github.com/nanostores/nanostores) `map` store and automatically persisted to `sessionStorage` under the key `lander-engine-state`, rehydrated on page load.

| Function | Signature | Description |
|---|---|---|
| `$state` | `MapStore<Record<string, any>>` | The raw Nanostores store. Subscribe with `$state.listen(cb)`. |
| `hydrateState` | `(data: Record<string, any>) => void` | Replace the entire state and persist it. |
| `setState` | `(key: string, value: any) => void` | Set a single key and persist. |
| `toggleState` | `(key: string) => void` | Flip a boolean key and persist. |
| `getState` | `(key: string) => any` | Read a key from memory, falling back to `sessionStorage`. |

### Dispatcher

```ts
import { dispatcher } from 'lander-engine/core';

// Dispatch a single action
await dispatcher.dispatch({ type: 'setState', payload: { key: 'foo', value: 42 } });

// Dispatch an array (from JSON props)
await dispatcher.dispatch(onCtaClick);
```

`dispatcher` is a singleton instance of `ActionDispatcher`. Unknown action types are automatically delegated to handlers registered in the `registry`.

### Loading State

Use `watchLoadingAction` to reactively observe loading and result state for a set of actions — works in any framework.

```ts
import { watchLoadingAction, getLoadingActionState } from 'lander-engine/core';
```

**`watchLoadingAction(actions, callback, explicitLoadingKeys?)`**

Subscribes to `$state` and calls `callback` with `{ isLoading, values }` whenever relevant state changes. Automatically extracts `loadingKey` and `stateKey` from the given actions (recursing into `sequence` and `conditional` branches).

```ts
const unsubscribe = watchLoadingAction(onCtaClick, ({ isLoading, values }) => {
  setLoading(isLoading);
  if (values.apiResponse) setData(values.apiResponse);
});

// Stop watching
unsubscribe();
```

**`getLoadingActionState(actions, explicitLoadingKeys?)`**

Synchronous one-shot read of the same derived state. Use for SSR-safe initial state.

```ts
const { isLoading, values } = getLoadingActionState(onCtaClick);
```

**React example (full pattern):**

```tsx
import { useState, useEffect } from 'react';
import { dispatcher, watchLoadingAction, getLoadingActionState } from 'lander-engine/core';

function useLoadingAction(actions: any) {
  const [state, setState] = useState(() => getLoadingActionState(actions));

  useEffect(() => {
    const unsubscribe = watchLoadingAction(actions, setState);
    return unsubscribe;
  }, [JSON.stringify(actions)]);

  return state;
}

export default function SubmitButton({ label, actions }) {
  const { isLoading, values } = useLoadingAction(actions);

  return (
    <button
      onClick={() => dispatcher.dispatch(actions)}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : label}
    </button>
  );
}
```

### Registry

The registry stores all components and custom action handlers. It is populated automatically at build time from your `components/` and `actions/` directories. You can also use it manually.

```ts
import { registry } from 'lander-engine/core';

// Register a single component
registry.registerComponent('MyButton', MyButton);

// Register multiple components
registry.registerComponents({ Hero, Footer, ContactForm });

// Register a custom action handler
registry.registerAction('sendAnalytics', async (payload) => {
  await fetch('/api/track', { method: 'POST', body: JSON.stringify(payload) });
});

// Register multiple action handlers
registry.registerActions({ sendAnalytics, logEvent });

// Retrieve
const Component = registry.getComponent('Hero');
const handler   = registry.getAction('sendAnalytics');
```

---

## Writing Components

Any file in your `components/` directory is automatically registered and available in JSON by its filename (without extension).

**React component:**

```tsx
// components/Hero.tsx
import { dispatcher, watchLoadingAction, getLoadingActionState } from 'lander-engine/core';
import { useState, useEffect } from 'react';

interface HeroProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: any[];
}

export default function Hero({ title, subtitle, ctaText, onCtaClick }: HeroProps) {
  const [state, setActionState] = useState(() => getLoadingActionState(onCtaClick));

  useEffect(() => {
    const unsub = watchLoadingAction(onCtaClick, setActionState);
    return unsub;
  }, [JSON.stringify(onCtaClick)]);

  return (
    <section className="p-10 text-center bg-[var(--color-background)]">
      <h1 className="text-5xl font-bold text-[var(--color-primary)]">{title}</h1>
      {subtitle && <p className="mt-4 text-[var(--color-secondary)]">{subtitle}</p>}

      {ctaText && (
        <button
          onClick={() => dispatcher.dispatch(onCtaClick)}
          disabled={state.isLoading}
          className="mt-6 px-8 py-3 bg-[var(--color-primary)] text-white rounded-[var(--token-buttonRadius)]"
        >
          {state.isLoading ? 'Loading...' : ctaText}
        </button>
      )}
    </section>
  );
}
```

**Astro component (zero-JS):**

```astro
---
// components/StaticAlert.astro
interface Props {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: string;
}
const { type = 'info', title, message } = Astro.props;
const colors = { info: 'blue', success: 'green', warning: 'yellow', error: 'red' };
const c = colors[type];
---
<div class={`border-l-4 border-${c}-500 bg-${c}-50 p-4 rounded`}>
  {title && <p class={`font-bold text-${c}-800`}>{title}</p>}
  {message && <p class={`text-${c}-700`}>{message}</p>}
</div>
```

> **Important:** React, Vue, and Svelte components are rendered as [Astro Islands](https://docs.astro.build/en/concepts/islands/) with `client:load`. Astro components are rendered as static HTML with no client-side JS.

---

## Custom Actions

Create `.ts` or `.js` files in your `actions/` directory. Export an object (default or named `actions`) where each key is an action type name and each value is the handler function.

```ts
// actions/analytics.ts
export default {
  trackEvent: async (payload: { event: string; properties?: Record<string, any> }) => {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  identify: async (payload: { userId: string }) => {
    window.analytics?.identify(payload.userId);
  },
};
```

Use in JSON like any built-in action:

```json
{
  "type": "trackEvent",
  "payload": { "event": "cta_clicked", "properties": { "step": "main" } }
}
```

---

## Plugin API

Create a `lander.config.js` in your project root to configure the engine and hook into the build lifecycle.

```js
// lander.config.js
export default {
  jsonConfigsDir: 'json_configs',   // default
  componentsDir:  'components',     // default
  actionsDir:     'actions',        // default
  outputDir:      'dist',           // default

  plugins: [
    {
      name: 'my-plugin',

      // Runs before workspace generation and Astro build
      onBeforeBuild: async (config) => {
        console.log('Building from:', config.projectRoot);
      },

      // Runs after `astro build` completes (build mode only)
      onAfterBuild: async (config) => {
        console.log('Output at:', config.outputDir);
      },

      // Register additional components programmatically
      registerComponents: () => ({
        ThirdPartyWidget: () => import('./vendor/Widget'),
      }),

      // Register additional action handlers programmatically
      registerActions: () => ({
        sendToHubspot: async (payload) => { /* ... */ },
      }),
    },
  ],
};
```

**Plugin interface:**

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Plugin identifier (used in logs) |
| `onBeforeBuild` | `async (config) => void` | Called before workspace generation |
| `onAfterBuild` | `async (config) => void` | Called after `astro build` only (not `dev`) |
| `registerComponents` | `() => ComponentMap` | Additional components to register |
| `registerActions` | `() => ActionMap` | Additional action handlers to register |

---

## Domain Routing

Map custom domains to specific campaigns by creating a `routing.config.js` in your project root. At build time, Lander reads each campaign's `flow.json` to resolve the `initialStep`, then generates three routing artifacts targeting different static hosts.

### `routing.config.js`

```js
// routing.config.js
export default {
  'campaign-a.com':     'campaign_alpha',
  'www.campaign-a.com': 'campaign_alpha',
  'campaign-b.com':     'campaign_beta',
  'promo.example.com':  'campaign_promo',
};
```

Each key is a hostname (no scheme, no trailing slash) and each value is a campaign ID — the folder name inside your `json_configs/` directory.

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

## CLI

```
Usage: lander <command> [options]
```

| Command | Description |
|---|---|
| `lander dev` | Generate workspace and start Astro dev server with HMR |
| `lander build` | Generate workspace, build static site, fire `onAfterBuild` plugins |
| `lander preview` | Serve the built production project with Gzip and Brotli support |

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `LANDER_JSON_CONFIGS_DIR` | `./json_configs` | Absolute path to JSON configs directory |
| `LANDER_CONTENT_PATHS` | `./src/**/*.{astro,jsx,tsx}` | JSON array or space-separated glob paths for Tailwind content scanning |
| `NODE_ENV` | — | Set to `production` for production builds |

---

## TypeScript Reference

The full type system is exported from the root `lander-engine` specifier.

```ts
import type {
  // Actions
  Action, ActionType,
  SetStateAction, ToggleStateAction, RestAction,
  NavigationAction, SequenceAction, ConditionalAction, UIAction,

  // Config
  LanderConfig, UserLanderConfig, LanderPlugin, RoutingConfig,

  // Schema
  FlowConfig, ThemeConfig, LayoutConfig, SEOConfig,
  ModalConfig, StepConfig, StepSection,
} from 'lander-engine';
```

**Package exports:**

| Specifier | Use |
|---|---|
| `lander-engine` | All types + root utilities (resolver, core) |
| `lander-engine/core` | `$state`, `setState`, `dispatcher`, `registry`, `watchLoadingAction`, etc. |
| `lander-engine/resolver` | `ConfigParser`, `deepMerge`, `resolveCascadingConfig` |
| `lander-engine/cli` | CLI entry (used by the `lander` binary) |

---

## Deployment

**1. Build the static site:**

```bash
lander build
```

Output is written to `.lander-engine/dist/`.

**2. Preview locally:**

```bash
npx serve .lander-engine/dist
# or
cd .lander-engine && npx astro preview --host 0.0.0.0 --port 4321
```

**3. Deploy to any static host:**

The contents of `.lander-engine/dist/` are plain static HTML/CSS/JS — deploy to Netlify, Vercel, GitHub Pages, AWS S3, Cloudflare Pages, or any CDN.

**Generated routes:**

```
dist/campaign_alpha/main/index.html
dist/campaign_alpha/checkout/index.html
dist/campaign_alpha/main.mobile/index.html   ← if mobile/ overrides exist
dist/index.html                              ← if routing.config.js is present
```

**Platform-specific redirect files** (generated when `routing.config.js` is present):

```
.lander-engine/public/_redirects   ← Netlify
.lander-engine/public/vercel.json  ← Vercel
```

---

## License

MIT
