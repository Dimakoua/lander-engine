# State Management

### `state.json`

`state.json` defines the initial global state for a campaign, serving as the single source of truth for both build‑time variable interpolation and runtime state reactivity.

#### Build‑Time Variable Interpolation

Values defined in `state.json` (and overridden by device or variant state files) can be referenced across all other campaign configurations (`flow.json`, `theme.json`, `layout.json`, `seo.json`, and `steps/*.json`) using the `{{ key }}` syntax.

- **Simple & Nested Keys**: Reference top-level properties like `{{ brandName }}` or deeply nested object structures like `{{ company.details.name }}`.
- **Type Preservation**: When an entire JSON field string matches a placeholder (e.g., `"renderIf": "{{ isPromoActive }}"`), the resolved value retains its original data type (boolean, number, object, array) rather than being converted into a string.

#### Runtime State & Reactivity

At runtime, the configuration state is loaded on page load and merged with device overrides (`mobile/state.json`), variant overrides (`variant_b/state.json`), and step-level state (`state` property in `steps/*.json`).

- **Nanostores & Persistence**: The resolved state is hydrated into a global Nanostores `$state` store and automatically persisted to `sessionStorage` under `lander-engine-state`.
- **Injected Context**: Lander automatically injects runtime context properties into state: `isMobile` (boolean), `variant` (string), `campaignId` (string), and `stepId` (string).

#### Example `state.json`

```json
{
  "userSegment": "guest",
  "isPromoActive": true,
  "discountCode": "WELCOME2026",
  "cartCount": 0,
  "brandName": "Acme Corp",
  "supportEmail": "support@acme.com"
}
```

#### Configuration Usage Examples

*String interpolation in a step*

```json
{
  "seo": {
    "title": "Welcome to {{ brandName }}",
    "description": "Contact us at {{ supportEmail }}"
  }
}
```

*Conditional section rendering with type preservation*

```json
{
  "sections": [
    {
      "component": "PromoBanner",
      "renderIf": "{{ isPromoActive }}",
      "props": { "code": "{{ discountCode }}" }
    }
  ]
}
```

*Nested path lookup*

```json
{
  // state.json: { "company": { "details": { "name": "Acme" } } }
  "title": "Welcome to {{ company.details.name }}"
}
```

#### Core State API Reference

Import runtime state functions from `lander-engine/core`:

```ts
import { $state, hydrateState, setState, toggleState, getState } from 'lander-engine/core';
```

| Function / Export | Signature | Description |
|---|---|---|
| `$state` | `MapStore<Record<string, any>>` | The raw Nanostores store. Subscribe with `$state.listen(cb)`. |
| `getState` | `(key: string) => any` | Read a key from memory, falling back to `sessionStorage`. |
| `setState` | `(key: string, value: any) => void` | Set a single key in state and persist to `sessionStorage`. |
| `toggleState` | `(key: string) => void` | Flip a boolean key in state and persist. |
| `hydrateState` | `(data: Record<string, any>) => void` | Replace the entire state store and persist. |

#### Component Usage Examples

**1. React Component (Reactive State Subscription)**

```tsx
// components/PromoBanner.tsx
import { useState, useEffect } from 'react';
import { $state, setState, toggleState } from 'lander-engine/core';

export default function PromoBanner({ promoKey = 'isPromoActive' }) {
  // Read initial state and subscribe to reactive updates
  const [store, setStore] = useState(() => $state.get());

  useEffect(() => {
    // Subscribe to Nanostores updates
    const unsubscribe = $state.listen((updatedState) => {
      setStore(updatedState);
    });
    return unsubscribe;
  }, []);

  const isPromoActive = store[promoKey];

  if (!isPromoActive) return null;

  return (
    <div className="bg-amber-100 p-4 flex justify-between items-center">
      <span>🎉 Special Offer: Use code <strong>{store.discountCode || 'SAVE10'}</strong>!</span>
      <button
        onClick={() => toggleState(promoKey)}
        className="text-sm text-gray-600 underline"
      >
        Dismiss
      </button>
    </div>
  );
}
```

**2. Vanilla JS / Astro Script (Imperative Read & Mutate)**

```html
<script>
  import { getState, setState } from 'lander-engine/core';

  // Read state value
  const segment = getState('userSegment');
  console.log('Current segment:', segment);

  // Mutate state value on interaction
  document.getElementById('opt-in-btn')?.addEventListener('click', () => {
    setState('hasOptedIn', true);
  });
</script>
```
