# Custom Components & Plugins

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