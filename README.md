# Lander Engine 🚀

`lander-engine` is a configuration-driven, JAMstack landing page meta-framework. It allows you to build high-performance, multi-step flows and A/B tests using pure JSON configurations, powered by **Astro**, **Nanostores**, and **Tailwind CSS**.

## Key Features

- **Zero-JS by Default**: Outputs static HTML; hydrates only interactive "Islands".
- **Cascading Overrides**: Built-in support for A/B variants and Device-specific (mobile/desktop) configurations.
- **Configuration-Driven**: Manage your entire campaign structure, theme, and state via JSON.
- **Action Dispatcher**: Framework-agnostic event bus to handle complex UI interactions and API calls.
- **Auto-Discovery**: Automatic registration of your UI components and custom action handlers.

---

## Architecture

The engine is split into three core layers:

1.  **CLI / Compiler**: Orchestrates the build process and generates a hidden Astro workspace.
2.  **Resolver Engine**: Merges cascading JSON configurations based on a priority matrix.
3.  **Runtime Core**: Lightweight client-side logic managing state (Nanostores) and actions.

---

## Getting Started

### 1. Installation

```bash
npm install lander-engine
```

### 2. Project Structure

Your project should follow this convention:

```text
my-lander-project/
├── components/           # UI Components (React, Vue, Astro)
├── actions/              # Custom Action Handlers (TypeScript/JS)
├── json_configs/         # Campaign Configurations
│   └── campaign_alpha/
│       ├── flow.json     # Routing logic
│       ├── theme.json    # Design tokens
│       ├── state.json    # Initial state
│       └── steps/        # Step layouts (main.json, etc.)
└── lander.config.js      # Engine Configuration
```

### 4. Custom Configuration (Optional)

You can override the default directory structure in `lander.config.js`:

```javascript
export default {
  jsonConfigsDir: 'my_configs', // Default: 'json_configs'
  componentsDir: 'my_components', // Default: 'components'
  actionsDir: 'my_actions', // Default: 'actions'
  outputDir: 'dist', // Default: 'dist'
  plugins: [],
};
```

---

## Full Example: "Campaign Alpha"

Here is how a real campaign is structured in your `json_configs/` directory.

### 1. `campaign_alpha/flow.json`

Defines the steps and routing.

```json
{
  "initialStep": "main",
  "steps": {
    "main": { "type": "normal", "next": "checkout" },
    "checkout": { "type": "normal", "next": "thanks" },
    "thanks": { "type": "normal" }
  }
}
```

### 2. `campaign_alpha/theme.json`

Defines design tokens used across the campaign.

```json
{
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#1e293b",
    "background": "#ffffff",
    "text": "#000000"
  },
  "tokens": {
    "buttonRadius": "8px"
  }
}
```

### 3. `campaign_alpha/steps/main.json`

Defines the layout and components for the 'main' step.

```json
{
  "sections": [
    {
      "component": "Hero",
      "props": {
        "title": "Build Better Landing Pages",
        "subtitle": "Configuration-driven, performant, and flexible.",
        "ctaText": "Get Started Now",
        "onCtaClick": [
          {
            "type": "navigation",
            "payload": { "to": "checkout", "type": "step" }
          }
        ]
      }
    },
    {
      "component": "FeatureList",
      "props": {
        "items": ["Zero-JS", "Cascading Overrides", "View Transitions"]
      }
    }
  ],
  "seo": {
    "title": "Campaign Alpha | Welcome"
  }
}
```

### 4. `components/Hero.tsx`

A simple React component used in the JSON above.

```tsx
import { dispatcher } from 'lander-engine/core';

export default function Hero({ title, subtitle, ctaText, onCtaClick }) {
  return (
    <section className="bg-[var(--color-background)] p-10 text-center">
      <h1 className="text-4xl font-bold text-[var(--color-primary)]">{title}</h1>
      <p className="mt-4 text-[var(--color-secondary)]">{subtitle}</p>
      <button
        onClick={() => dispatcher.dispatch(onCtaClick)}
        className="mt-6 px-6 py-2 bg-[var(--color-primary)] text-white rounded"
      >
        {ctaText}
      </button>
    </section>
  );
}
```

---

## Configuration Details

### Cascading Priority

The Resolver merges configurations in the following order (highest priority first):

1.  **Variant + Device**: `campaign/variant_B/mobile/steps/main.json`
2.  **Variant**: `campaign/variant_B/steps/main.json`
3.  **Device**: `campaign/mobile/steps/main.json`
4.  **Base**: `campaign/steps/main.json`

### Action Dispatcher

You can define interactive behavior directly in your JSON sections:

```json
{
  "component": "SubmitButton",
  "props": {
    "onClick": [
      {
        "type": "setState",
        "payload": { "key": "isLoading", "value": true }
      },
      {
        "type": "rest",
        "payload": {
          "url": "/api/lead",
          "method": "POST",
          "onSuccess": [{ "type": "navigation", "payload": { "to": "thanks", "type": "step" } }]
        }
      }
    ]
  }
}
```

---

## Extensibility

### Plugin API

Create a `lander.config.js` to hook into the build lifecycle:

```javascript
export default {
  plugins: [
    {
      name: 'my-plugin',
      onBeforeBuild: async (config) => {
        console.log('Preparing build for:', config.projectRoot);
      },
    },
  ],
};
```

### Auto-Discovery

Any component placed in `/components` is automatically available in your JSON by its filename. For example, `components/Header.tsx` can be used as `"component": "Header"`.

---

## Development

- `npm run build`: Bundles the engine.
- `npm run dev`: Starts the engine in watch mode.
- `npm run typecheck`: Validates TypeScript interfaces.

## Production / Release

1. Build engine and example output:

```bash
cd <path-to-your-repo>
npm install
npm run build
```

2. Confirm generated static site:

- `your-repo/.lander-engine/dist/campaign_name/main/index.html`
- `your-repo/.lander-engine/dist/campaign_name/secondary/index.html`
- `your-repo/.lander-engine/dist/campaign_name/confirmation/index.html`

3. Optional preview:

```bash
cd example
npx astro preview --host 0.0.0.0 --port 4321
```

4. Deploy static output to any static host (Netlify, Vercel, GitHub Pages, S3, etc.) from:

- `your-repo/.lander-engine/dist`

5. Environment variables for production:

- `LANDER_JSON_CONFIGS_DIR` (defaults to `./json_configs`)
- `LANDER_CONTENT_PATHS` (for Tailwind content scan)
- `NODE_ENV=production`
- `PORT` as needed

6. Common production server run (optional):

```bash
npm run build
npx serve -s .lander-engine/dist
```

## License

MIT
