#!/usr/bin/env node
import { cac } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import { WorkspaceGenerator } from './generate';
import { Builder } from './build';
import { LanderConfig, UserLanderConfig } from '@/types/config';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cli = cac('lander');

/**
 * Validates that required directories and files exist.
 */
async function validateProject(config: LanderConfig): Promise<void> {
  const projectRoot = config.projectRoot;

  // Check package.json exists
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  if (!(await fs.pathExists(pkgJsonPath))) {
    throw new Error(
      `package.json not found in project root: ${projectRoot}\n` +
        `Make sure you're running this command from your project directory.`
    );
  }

  // Check if astro is installed
  const astroPath = path.join(projectRoot, 'node_modules', 'astro');
  if (!(await fs.pathExists(astroPath))) {
    throw new Error(`Astro not found. Install it with:\n` + `  npm install --save astro`);
  }

  // Warn if json_configs directory doesn't exist
  const configDir = path.join(projectRoot, config.jsonConfigsDir || 'json_configs');
  if (!(await fs.pathExists(configDir))) {
    console.warn(`⚠  Configuration directory not found: ${configDir}`);
    console.warn(`   Create it and add your campaign configurations there.`);
  }
}

/**
 * Resolves the Lander configuration from lander.config.js or defaults.
 */
async function resolveConfig(): Promise<LanderConfig> {
  const projectRoot = process.cwd();
  // __dirname is dist/cli, so we go up two levels to reach the package root
  const engineRoot = path.resolve(__dirname, '../../');

  // Try to load lander.config.js
  const configPath = path.resolve(projectRoot, 'lander.config.js');
  let userConfig: UserLanderConfig = {};

  if (await fs.pathExists(configPath)) {
    try {
      const module = await import(`file://${configPath}`);
      userConfig = module.default || module;
      console.log(`✓ Loaded config from ${configPath}`);
    } catch (e) {
      console.warn(
        `⚠  Failed to load lander.config.js: ${e instanceof Error ? e.message : String(e)}`
      );
      console.warn(`   Using default configuration`);
    }
  }

  const config: LanderConfig = {
    projectRoot,
    engineRoot,
    jsonConfigsDir: 'json_configs',
    componentsDir: 'components',
    actionsDir: 'actions',
    outputDir: 'dist',
    plugins: [],
    ...userConfig,
  };

  return config;
}

/**
 * Runs all plugin hooks for a given lifecycle event.
 */
async function runPlugins(
  config: LanderConfig,
  hook: 'onBeforeBuild' | 'onAfterBuild'
): Promise<void> {
  if (!config.plugins || config.plugins.length === 0) return;

  for (const plugin of config.plugins) {
    if (plugin[hook]) {
      try {
        console.log(`↪ Running plugin: ${plugin.name}`);
        await plugin[hook]!(config);
      } catch (error) {
        throw new Error(
          `Plugin '${plugin.name}' hook '${hook}' failed: ` +
            `${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }
}

// Development server command
cli.command('dev', 'Start the development server').action(async () => {
  try {
    console.log('🚀 Lander Engine - Development Mode\n');

    const config = await resolveConfig();
    await validateProject(config);

    const generator = new WorkspaceGenerator(config);
    const builder = new Builder(config);

    await runPlugins(config, 'onBeforeBuild');

    console.log('\n📦 Generating workspace...');
    await generator.generate();

    console.log('\n🔥 Starting development server...');
    await builder.runAstro('dev');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
});

// Production build command
cli.command('build', 'Build the static landing pages').action(async () => {
  try {
    console.log('🚀 Lander Engine - Production Build\n');

    const config = await resolveConfig();
    await validateProject(config);

    const generator = new WorkspaceGenerator(config);
    const builder = new Builder(config);

    await runPlugins(config, 'onBeforeBuild');

    console.log('\n📦 Generating workspace...');
    await generator.generate();

    console.log('\n🏗  Building project...');
    await builder.runAstro('build');

    await runPlugins(config, 'onAfterBuild');

    console.log('\n✨ Build complete! Output: .lander-engine/dist');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
});

cli.help();
cli.version('0.1.0');
cli.parse();
