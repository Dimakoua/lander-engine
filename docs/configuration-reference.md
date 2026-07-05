# Configuration Reference

**Note:** For a better Developer Experience (DX), you can reference JSON schemas in your campaign configuration files. This enables IDEs like VS Code to offer auto-completion, hover tooltips, and real-time validation.

Add a `$schema` property to your JSON files, pointing to the corresponding schema in the `schemas/` directory of the engine. The exact path depends on where your configuration file is located relative to the engine installation.

* Example for `theme.json`: `"$schema": "../../schemas/theme.schema.json"`
* Example for `flow.json`: `"$schema": "../../schemas/flow.schema.json"`
* Example for `layout.json`: `"$schema": "../../schemas/layout.schema.json"`
* Example for `steps/*.json`: `"$schema": "../../../schemas/step.schema.json"`

---

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
    "body": "Inter, sans-serif",
    "heading": "Roboto, sans-serif"
  },
  "fontSources": [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
  ],
  "spacing": {
    "md": "16px",
    "lg": "24px"
  },
  "borderRadius": {
    "sm": "4px",
    "md": "8px"
  },
  "tokens": {
    "buttonRadius": "12px",
    "cardShadow":   "0 4px 24px rgba(0,0,0,0.08)"
  },
  "favicon": "/assets/campaign-a-icon.svg",
  "styles": {
    "body": {
      "backgroundColor": "var(--color-background)",
      "margin": 0
    },
    "h1, h2, h3": {
      "color": "var(--color-text)"
    }
  }
}
```

**CSS variable mapping:**

| JSON path | CSS variable |
|---|---|
| `colors.primary` | `--color-primary` |
| `colors.secondary` | `--color-secondary` |
| `colors.background` | `--color-background` |
| `fonts.body` | `--font-body` |
| `fonts.heading` | `--font-heading` |
| `spacing.md` | `--spacing-md` |
| `borderRadius.md` | `--border-radius-md` |
| `tokens.buttonRadius` | `--token-buttonRadius` |

Use these in your components and Tailwind classes:

```tsx
// In a component
<h1 className="text-[var(--color-primary)]">Hello</h1>
<button style={{ borderRadius: 'var(--token-buttonRadius)' }}>Click</button>
```

#### Custom & Local Asset Fonts

##### 1. Setting up More Than 2 Fonts
You can define any number of keys in the `fonts` object—you are not limited to just `body` and `heading`. Each key dynamically generates a `--font-<key>` CSS custom property.

```json
  "fonts": {
    "body": "Inter, sans-serif",
    "heading": "Roboto, sans-serif",
    "accent": "Playfair Display, serif",
    "code": "Fira Code, monospace"
  },
  "fontSources": [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap",
    "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap"
  ]
```

##### 2. Using Local Fonts from the `assets/` Folder
If you have local font files (e.g., `.woff2`), place them inside your configured assets folder (default is `assets/` at the project root). The build process copies this folder directly to the static output root:

1. Put font files in `assets/fonts/MyCustomFont.woff2`.
2. Create `assets/css/local-fonts.css` and declare the `@font-face`:
   ```css
   @font-face {
     font-family: 'MyCustomFont';
     src: url('/fonts/MyCustomFont.woff2') format('woff2');
     font-weight: 400;
     font-style: normal;
     font-display: swap;
   }
   ```
3. Load the local stylesheet and register the font key in your `theme.json`:
   ```json
   {
     "fonts": {
       "body": "Inter, sans-serif",
       "heading": "Roboto, sans-serif",
       "custom": "MyCustomFont, sans-serif"
     },
     "fontSources": [
       "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
       "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
       "/css/local-fonts.css"
     ]
   }
   ```

##### 3. Using the Fonts in Components
You can reference the generated CSS variable `--font-<key>` in style attributes or Tailwind arbitrary values:

* **CSS / Inline Styles**:
  ```tsx
  <div style={{ fontFamily: 'var(--font-custom)' }}>Hello local font!</div>
  ```
* **Tailwind CSS (Arbitrary Values)**:
  ```tsx
  <div className="font-[family-name:var(--font-custom)]">Hello local font!</div>
  ```
* **Tailwind CSS Config Integration**:
  If you are configuring a custom `tailwind.config.js` for your campaign templates, extend the `fontFamily` setting:
  ```javascript
  module.exports = {
    theme: {
      extend: {
        fontFamily: {
          custom: ['var(--font-custom)', 'sans-serif'],
        },
      },
    },
  };
  ```
  Then use the Tailwind utility class directly:
  ```tsx
  <div className="font-custom">Hello local font!</div>
  ```


| Field | Type | Required | Description |
|---|---|---|---|
| `colors` | `Record<string, string>` | Yes | Color palette |
| `fonts` | `Record<string, string>` | No | Font stack definitions |
| `fontSources` | `string[]` | No | External font stylesheet URLs |
| `spacing` | `Record<string, string>` | No | Spacing scale |
| `borderRadius` | `Record<string, string>` | No | Border-radius scale |
| `tokens` | `Record<string, any>` | No | Arbitrary named design tokens |
| `favicon` | `string` | No | Favicon URL (root-relative or absolute). Supported formats: `.svg`, `.ico`, `.png`, `.jpg`, `.webp`. Falls back to `/favicon.svg`. |
| `styles` | `Record<string, Record<string, string \| number>>` | No | Custom global CSS resets and styles. Keys are selectors, values are CSS properties. If omitted, sensible default resets are injected (e.g. `margin: 0` on `body`). |

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
            "payload": { "to": "checkout", "operation": "step" }
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

## Custom Error Pages

Lander Engine allows you to define custom fallback error components for standard HTTP errors, such as `404` and `500`.

To configure custom error pages globally, add the `errorPages` object to your `lander.config.js` or define it inside a campaign's `layout.json`. Each key is a string representing the HTTP error code, mapping to a registered component:

```js
// lander.config.js
export default {
  errorPages: {
    '404': {
      component: 'Custom404',
      props: { message: "Oops, we couldn't find that page!" }
    },
    '500': {
      component: 'Custom500'
    }
  }
};
```

If you leave this out, a simple built-in unbranded HTML fallback will be displayed for `404` and `500` routes.

---
