# Technical Design Document: Lander Engine 

## 1. Executive Summary
`lander-engine` is a configuration-driven, JAMstack landing page meta-framework distributed as an npm package. It enables product and marketing teams to rapidly deploy highly performant, multi-step flows, A/B tests, and device-specific variations using pure JSON configurations. 

Built on top of **Astro** and **Nanostores**, the engine outputs zero-JS static HTML by default. It utilizes an Islands Architecture to hydrate only the interactive components (e.g., checkouts, complex forms) and provides a Single Page Application (SPA) feel across multi-step flows via native View Transitions. 

## 2. Core Technologies
* **Build Engine & Routing:** Astro (programmatic CLI generation)
* **Language & Type Safety:** TypeScript (Native interfaces, lightweight build-time assertions)
* **State Management:** Nanostores (Framework-agnostic, atomic state outside the UI tree)
* **Styling:** Tailwind CSS + `tailwind-merge` + `clsx`
* **File System Operations:** Vite's `import.meta.glob` + `fast-glob`
* **Package Bundler:** `tsup` (esbuild) for compiling the npm package.

## 3. System Architecture Layers

The engine operates across three distinct layers to cleanly separate the build-time compilation from the runtime execution.

### 3.1. The CLI / Compiler (`@lander-engine/cli`)
The entry point for the developer, acting as an abstraction over the Astro build process.
* **Validation & Parsing:** Scans the `json_configs` directory, parsing JSON natively and asserting structural integrity before build.
* **Auto-Discovery:** Scans the consumer's `/components` and `/actions` directories, automatically generating the registry maps for runtime execution.
* **Workspace Generation:** Dynamically generates a hidden Astro workspace (`.lander-engine`), mapping the resolved JSON configurations to Astro's `getStaticPaths`.
* **Compilation:** Invokes `astro build` programmatically to output the highly optimized static `/dist` folder.

### 3.2. The Resolver Engine (`@lander-engine/resolver`)
Responsible for parsing the `json_configs` tree and merging configurations using a **Cascading Fallback Strategy**. 
* **Priority Matrix:** Resolves the final state of a page by layering specific overrides on top of base configurations.
    1.  **Variant + Device:** `example1/B/mobile/steps/main.json` (Highest Priority)
    2.  **Variant Only:** `example1/B/steps/main.json`
    3.  **Device Only:** `example1/mobile/steps/main.json`
    4.  **Base Default:** `example1/steps/main.json` (Lowest Priority)

### 3.3. The Runtime Core (`@lander-engine/core`)
The lightweight client-side JavaScript that manages interactivity and state.
* **Component Registry:** A dynamic map linking string identifiers in the JSON (e.g., `"component": "PricingCard"`) to the auto-discovered UI components.
* **Condition Evaluator:** Evaluates `"renderIf"` blocks for conditional mounting (e.g., user-agent parsing or reactive state subscription).
* **Action Dispatcher:** An asynchronous event bus handling UI interactions via a middleware chain.

## 4. State Management & Islands Architecture
To bridge the gap between static HTML and SPA interactivity, the engine relies on **Nanostores**.
* Components are rendered as isolated Astro Islands (`client:visible`, `client:load`).
* Because Islands do not share a React/Vue context tree, they communicate entirely through the global Nanostore.
* The Action Dispatcher can mutate the Nanostore from outside the UI framework, triggering instant, reactive re-renders only in the specific Islands subscribed to that state slice.

## 5. Extensibility: Auto-Discovery & Plugins
The engine prioritizes "Convention over Configuration" while maintaining an Inversion of Control (IoC) plugin model.

### 5.1. Auto-Discovery
Developers drop files into specific directories, and the compiler handles the wiring via `import.meta.glob`:
* **`/components`**: Any valid UI component (React, Vue, Astro) placed here is automatically added to the Component Registry.
* **`/actions`**: Exported functions placed here are registered as custom action types available to the JSON config's event arrays.

### 5.2. Plugin API (`lander.config.ts`)
For complex integrations, plugins can hook into the engine's lifecycle:
* `engine.registerAction(name, handler)`: Registers complex, multi-step action handlers.
* `engine.registerComponent(name, component)`: Injects third-party UI components into the registry.
* `engine.onStateChange(callback)`: Hooks into global state mutations for side-effects.

## 6. The Action Dispatcher System
The Dispatcher processes arrays of actions defined in the JSON event hooks (e.g., `"onClick"`, `"onMount"`).

**Core Supported Actions:**
* **`rest`**: Executes configurable `fetch` requests. Maps payload data from the current state and writes response data back to state.
* **`setState` / `toggleState`**: Mutates the isolated Nanostore.
* **`Maps`**: Triggers SPA-like View Transitions between steps or redirects externally.
* **`sequence`**: Wraps an array of actions to ensure sequential, awaited execution.
* **`conditional`**: Evaluates a state value to branch action logic.
* **`ui`**: Browser utilities (e.g., `scrollTo`, `copyToClipboard`).

## 7. JSON Configuration Contracts
The `json_configs` directory dictates the structure, style, and flow of the output.

* **`flow.json`**: Defines the multi-step routing tree. Controls whether steps are `"type": "normal"` or `"type": "popup"`.
* **`theme.json`**: Defines design tokens. The compiler uses this to dynamically generate CSS variables and Tailwind classes.
* **`layout.json`**: Defines repeating structural elements and injects external scripts/pixels.
* **`seo.json`**: Static meta tags, Open Graph data, and canonical URLs.
* **`state.json`**: The initial hydration state for the Nanostore.
* **`steps/*.json`**: The actual page layouts, containing the `sections` array mapping to the Component Registry.

## 8. Consumer Application Structure
This represents how a developer utilizing the npm package structures their repository.

```text
my-lander-project/
├── components/           # Auto-discovered UI components (React/Vue/Astro/Solid)
│   ├── PricingCard.tsx   
│   └── CheckoutForm.tsx
├── actions/              # Auto-discovered custom action handlers
│   ├── submitLead.ts     
│   └── trackPixel.ts
├── json_configs/         # Configuration Directory
│   ├── campaign_alpha/
│   │   ├── theme.json
│   │   ├── seo.json
│   │   ├── layout.json
│   │   ├── flow.json
│   │   ├── state.json
│   │   ├── mobile/       # Cascading device override
│   │   ├── variant_B/    # Cascading A/B test override
│   │   └── steps/        
│   │       ├── main.json
│   │       └── checkout.json
├── package.json
└── lander.config.ts      # Engine initialization & Plugin registration
```

## 9. Engine Internal Package Structure
This represents the internal repository architecture of the lander-engine npm package itself. It uses a modern /src setup with conditional exports defined in its package.json.

lander-engine/             # The Engine Repository Root
├── package.json           # Defines exports: ".", "./cli", "./core", "./resolver"
├── tsup.config.ts         # Bundler config (esbuild) to output CJS and ESM
├── src/
│   ├── cli/               # The command-line interface logic
│   │   ├── index.ts       # CLI entry point (uses cac or commander)
│   │   ├── build.ts       # Programmatic invocation of Astro
│   │   └── generate.ts    # Logic for writing the hidden .lander-engine workspace
│   ├── core/              # Client-side runtime code (shipped to browser)
│   │   ├── dispatcher.ts  # The Action Event Bus and middleware chain
│   │   ├── state.ts       # Nanostores initialization and wrapper
│   │   ├── registry.ts    # Auto-discovery runtime mapper
│   │   └── plugins.ts     # IoC plugin registration API
│   ├── resolver/          # Build-time JSON parsing and cascading logic
│   │   ├── cascade.ts     # A/B & Device merging matrix
│   │   └── parser.ts      # File system traversal logic
│   └── types/             # Shared TypeScript definitions
│       ├── config.ts      # Plugin and engine config interfaces
│       ├── actions.ts     # Action payload interfaces (RestAction, SetStateAction)
│       └── schema.ts      # JSON structure interfaces (FlowConfig, StepConfig)
└── templates/             # Base Astro boilerplate injected during build time
    └── astro-base/        
        ├── astro.config.mjs
        └── src/
            └── pages/
                └── [...slug].astro  # The dynamic catch-all route handler
```