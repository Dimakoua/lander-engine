# Lander Engine 🚀

`lander-engine` is a configuration-driven, JAMstack landing page meta-framework. It allows you to build high-performance, multi-step flows and A/B tests using pure JSON configurations, powered by **Astro**, **Nanostores**, and **Tailwind CSS**.

## Key Features

-   **Zero-JS by Default**: Outputs static HTML; hydrates only interactive "Islands".
-   **Cascading Overrides**: Built-in support for A/B variants and Device-specific (mobile/desktop) configurations.
-   **Configuration-Driven**: Manage your entire campaign structure, theme, and state via JSON.
-   **Action Dispatcher**: Framework-agnostic event bus to handle complex UI interactions and API calls.
-   **Auto-Discovery**: Automatic registration of your UI components and custom action handlers.

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
  jsonConfigsDir: 'my_configs',   // Default: 'json_configs'
  componentsDir: 'my_components', // Default: 'components'
  actionsDir: 'my_actions',       // Default: 'actions'
  outputDir: 'dist',              // Default: 'dist'
  plugins: []
};
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
      }
    }
  ]
};
```

### Auto-Discovery
Any component placed in `/components` is automatically available in your JSON by its filename. For example, `components/Header.tsx` can be used as `"component": "Header"`.

---

## Development

-   `npm run build`: Bundles the engine.
-   `npm run dev`: Starts the engine in watch mode.
-   `npm run typecheck`: Validates TypeScript interfaces.

## License

MIT
