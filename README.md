# lander-engine

> Configuration-driven JAMstack landing page meta-framework. Build multi-step campaign flows, A/B tests, and device-targeted experiences using pure JSON — no custom routing code required.

[![npm version](https://img.shields.io/npm/v/lander-engine)](https://www.npmjs.com/package/lander-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

## Documentation

The documentation has been modularized for easier navigation. Please refer to the specific guides below:

- [Getting Started](docs/getting-started.md)
  - Installation
  - Quick Start
  - Project Structure
  - CLI
  - Deployment
- [Configuration Reference](docs/configuration-reference.md)
  - flow.json
  - theme.json
  - layout.json
  - steps/*.json
  - Cascading Override System
  - Custom Error Pages
- [State Management](docs/state-management.md)
  - Runtime Core API
- [Actions & Dispatcher](docs/actions-and-events.md)
  - setState, toggleState, rest, navigation, sequence, conditional, ui
- [Domain Routing & Hosting](docs/routing-and-domains.md)
- [Telemetry & Analytics](docs/telemetry.md)
- [Custom Components & Plugins](docs/extending-and-plugins.md)
  - Writing Components
  - Custom Actions
  - Plugin API

---

## A/B Testing

Lander Engine supports A/B testing out of the box using its **Cascading Override System**. By placing variant‑specific JSON files in a sub‑folder of `json_configs` you can define alternative layouts, themes, or content that are served to a defined portion of traffic.

- **Folder structure**: `json_configs/<campaign>/variants/<variant-name>/...` mirrors the standard config hierarchy. Any file present in a variant folder overrides the same file in the base campaign folder.
- **Activating a variant**: Set the `variant` query parameter (e.g., `?variant=blue`) or configure your traffic‑splitting logic via the `abTest` field in `flow.json` to randomly assign users.
- **Example**:
  ```json
  // json_configs/my-campaign/flow.json
  {
    "steps": [{ "id": "home", "component": "Home" }],
    "abTest": { "variant": "blue", "percentage": 50 }
  }
  ```
  ```json
  // json_configs/my-campaign/variants/blue/theme.json
  {
    "primaryColor": "#1e90ff",
    "logo": "/assets/logo-blue.png"
  }
  ```
  Visitors who fall into the *blue* bucket will receive the overridden theme.
- **Metrics**: Pair the variant with your analytics setup (see the Telemetry guide) to measure conversion rates.

This mechanism works for any configuration file – `theme.json`, `layout.json`, `steps/*.json`, etc., enabling extensive experimentation without code changes.

---

## License

MIT
