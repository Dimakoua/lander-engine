# Implementation Plan: Lander Engine

This document outlines the step-by-step implementation of the `lander-engine` meta-framework.

## Phase 1: Project Scaffolding & Infrastructure
Set up the repository structure, build tools, and core configurations.

- [x] **1.1. Initialize Repository & Workspace**
  - Create a monorepo-ready structure or a single package with conditional exports as defined in `design.md`.
  - Initialize `package.json` with required dependencies: `astro`, `nanostores`, `tsup`, `cac`, `fast-glob`, `fs-extra`, `tailwind-merge`, `clsx`.
  - Configure `tsconfig.json` with strict mode and path aliases.
- [x] **1.2. Configure `tsup` for Bundling**
  - Set up `tsup.config.ts` to output ESM and CJS for different entry points: `.`, `./cli`, `./core`, `./resolver`.
- [x] **1.3. Define Core TypeScript Interfaces (`src/types/`)**
  - [x] `config.ts`: Interfaces for `LanderConfig` and plugin hooks.
  - [x] `schema.ts`: Interfaces for `FlowConfig`, `ThemeConfig`, `LayoutConfig`, `StepConfig`, and `SEOConfig`.
  - [x] `actions.ts`: Interfaces for all action types (`RestAction`, `SetStateAction`, `NavigationAction`, etc.).

## Phase 2: The Resolver Engine (`src/resolver/`)
Implement the build-time logic for parsing and merging JSON configurations.

- [x] **2.1. Implement File System Traversal (`parser.ts`)**
  - Use `fast-glob` to scan the `json_configs` directory.
  - Implement robust error handling for missing or malformed JSON files.
- [x] **2.2. Implement Cascading Fallback Strategy (`cascade.ts`)**
  - Create a recursive deep-merge utility.
  - Implement the priority matrix logic: `Variant+Device > Variant > Device > Base`.
  - Ensure `theme.json` and `state.json` are correctly merged across overrides.

## Phase 3: The Runtime Core (`src/core/`)
Develop the lightweight client-side logic for state and interactivity.

- [x] **3.1. Nanostores Initialization (`state.ts`)**
  - Set up the global Nanostore for landing page state.
  - Create helper functions for getting/setting state slices.
- [x] **3.2. Action Dispatcher & Middleware (`dispatcher.ts`)**
  - Implement the asynchronous event bus.
  - Build the core action handlers: `setState`, `toggleState`, `rest`, `navigation`, `sequence`, `conditional`.
  - Ensure the dispatcher is framework-agnostic.
- [x] **3.3. Component Registry (`registry.ts`)**
  - Create a central registry for mapping string identifiers to UI components.
  - Implement the `registerComponent` and `registerAction` methods.

## Phase 4: CLI & Compiler (`src/cli/`)
Build the command-line interface to orchestrate the build process.

- [x] **4.1. CLI Entry Point (`index.ts`)**
  - Use `cac` or `commander` to define `dev` and `build` commands.
- [x] **4.2. Workspace Generation (`generate.ts`)**
  - Logic to create a hidden `.lander-engine` directory.
  - Symlink or copy the `templates/astro-base` into the hidden workspace.
  - Programmatically generate registry maps for auto-discovered components/actions.
- [x] **4.3. Programmatic Astro Invocation (`build.ts`)**
  - Wrap `astro dev` and `astro build` to run within the `.lander-engine` context.

## Phase 5: Astro Base Template (`templates/astro-base/`)
Create the foundational Astro setup that powers the engine.

- [x] **5.1. Dynamic Catch-all Route (`[...slug].astro`)**
  - Implement `getStaticPaths` to map resolved JSON configurations to URLs.
  - Create the layout wrapper that injects `theme.json` tokens as CSS variables.
- [x] **5.2. Section Renderer**
  - Logic to iterate through `sections` in a step JSON and render the corresponding Islands.
  - Implement the `renderIf` condition evaluator at the Astro component level.

## Phase 6: Auto-Discovery & Registry
Automate the wiring of user-provided code.

- [x] **6.1. Build-time Auto-Discovery**
  - In the CLI, use `import.meta.glob` patterns to find files in `/components` and `/actions`.
  - Generate a `registry-manifest.ts` file in the hidden workspace that imports and registers these files.
- [x] **6.2. Runtime Integration**
  - Ensure the generated manifest is loaded by the Core runtime before hydration.

## Phase 7: Plugin API & Extensibility
Expose hooks for advanced customization.

- [x] **7.1. Implement `lander.config.ts` Loader**
  - Logic to find and execute the user's config file at build time.
- [x] **7.2. Plugin Lifecycle Hooks**
  - Support `engine.registerAction` and `engine.registerComponent` via the config file.

## Phase 8: Validation & Quality Assurance
Ensure the engine is robust and performant.

- [x] **8.1. JSON Structural Validation**
  - Implement manual structural checks to validate user JSON configurations against the defined interfaces.
- [x] **8.2. Unit & Integration Tests**
  - Test the Resolver's merging logic.
  - Test the Action Dispatcher's execution flow.
- [x] **8.3. E2E Build Test**
  - Create a sample "campaign" and verify the CLI outputs the expected static HTML.
- [x] **8.4. Performance Audit**
  - Verify zero-JS default output and minimal hydration for Islands.
