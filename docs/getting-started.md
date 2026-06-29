# Getting Started

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
├── assets/                      # Static assets like images, SVGs, fonts, etc.
│   └── logo.svg
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

### Using Static Assets

The `assets` directory is natively supported. Any files placed inside the root `assets/` folder (or your custom `assetsDir` path defined in `lander.config.js`) will be automatically copied into the final build environment.

You can securely reference these static assets in your UI components via the globally available `@assets/` path alias.

**Example usage in a React or Astro component:**

```jsx
import logo from '@assets/logo.svg';

function MyHeader() {
  return <img src={logo.src || logo} alt="Brand Logo" />;
}
```

The bundler will ensure these assets are hashed, compressed, and served efficiently in the `dist` directory on build.

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
