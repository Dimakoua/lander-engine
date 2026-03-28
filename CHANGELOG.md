# Changelog

All notable changes to this project will be documented in this file.

## [0.3.1] - 2026-03-28

### Added
- **Build System**: Enabled `minify: true` in `tsup.config.ts` for optimized production bundles.

### Fixed
- **Build System**: Resolved an issue where absolute local paths (e.g., `/Users/.../...`) were being included in generated source map files.
- **Portability**: Source maps now use relative paths, ensuring the published package is portable across different developer environments.

### Changed
- **Build Configuration**: Enabled `treeshake` and configured `esbuildOptions` in `tsup.config.ts` to improve build output quality and path resolution.
- **Source Maps**: Explicitly set `sourceRoot` to ensure consistent mapping between generated code and source files.

## [0.3.0]

### Added
- **Performance**: Added `astro-compressor` and `sirv` as dependencies.
- **Build Report**: Enhanced the build process to report sizes of generated HTML files, including Gzip and Brotli compression sizes.
- **Preview Server**: Implemented a preview server with compression support using `sirv`.
- **Astro Template**: Updated the Astro configuration template to include the compressor integration.
- **Testing**: Added comprehensive unit tests for dispatcher, loading, registry, state, and cascade functionalities.
- **CI/CD**: Added GitHub Actions CI workflow for automated testing and building.

### Fixed
- **Author Information**: Updated author name in `LICENSE` and `package.json` to include the full name.

### Changed
- **Navigation**: Streamlined SPA navigation and removed redundant redirect checks.
- **Project Structure**: Refactored module exports and improved overall code structure.

## [0.2.0]

### Fixed
- **Navigation**: Prevented flash of wrong URL during redirect checks.

### Changed
- **Navigation**: Enhanced SPA navigation logic.
- **Module Imports**: Updated internal chunk imports for better consistency.

## [0.1.0]

### Added
- **Core Engine**: Initial release of the configuration-driven JAMstack landing page meta-framework.
- **CLI**: Initial implementation of the `lander` CLI tool with built-in template management and validation.
- **Astro Base Template**: Provided a base Astro template for landing page generation.
- **Project Configuration**: Set up `tsup` for bundling, TypeScript for type safety, and optimized package distribution.
