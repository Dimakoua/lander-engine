# Actions & Dispatcher


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
      { "type": "navigation", "payload": { "to": "thanks", "operation": "step" } }
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
{ "type": "navigation", "payload": { "to": "checkout", "operation": "step" } }

{ "type": "navigation", "payload": { "to": "https://example.com", "operation": "external", "replace": true } }
```

| Field | Type | Default | Description |
|---|---|---|---|
| `to` | `string` | — | **Required.** Step ID (for `operation: "step"`) or full URL (for `operation: "external"`) |
| `operation` | `"step"` \| `"external"` | `"step"` | Navigation mode (preferred) |
| `type` *(deprecated)* | `"step"` \| `"external"` | — | Legacy field, will be removed in future releases |
| `replace` | `boolean` | `false` | Use `location.replace()` instead of `href` assignment |

### `sequence`

Run multiple actions in order, waiting for each to complete.

```json
{
  "type": "sequence",
  "payload": {
    "actions": [
      { "type": "setState",  "payload": { "key": "step", "value": 2 } },
      { "type": "ui",        "payload": { "operation": "scrollTo", "params": { "top": 0 } } },
      { "type": "navigation","payload": { "to": "checkout", "operation": "step" } }
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
      { "type": "navigation", "payload": { "to": "checkout", "operation": "step" } }
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
