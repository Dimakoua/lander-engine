#!/usr/bin/env node
import { cac } from 'cac';
import path from 'path';
import fs from 'fs-extra';
import { WorkspaceGenerator } from './generate';
import { Builder } from './build';
import { LanderConfig, UserLanderConfig, RoutingConfig } from '@/types/config';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cli = cac('lander');

async function resolveConfig(): Promise<LanderConfig> {
  const projectRoot = process.cwd();
  // __dirname is dist/cli, so we go up twice to reach the package root
  const engineRoot = path.resolve(__dirname, '../../');
  
  // Simplified loader: in production this would use jiti or similar for TS support
  const configPath = path.resolve(projectRoot, 'lander.config.js'); 
  let userConfig: UserLanderConfig = {};

  if (await fs.pathExists(configPath)) {
    try {
      const module = await import(configPath);
      userConfig = module.default || module;
    } catch (e) {
      console.warn('Failed to load lander.config.js, using defaults');
    }
  }

  // Load routing.config.js (domain → campaign mapping)
  let routingConfig: RoutingConfig | undefined;
  const routingConfigPath = path.resolve(projectRoot, 'routing.config.js');
  if (await fs.pathExists(routingConfigPath)) {
    try {
      const module = await import(routingConfigPath);
      routingConfig = module.default || module;
    } catch (e) {
      console.warn('Failed to load routing.config.js, domain routing will be skipped');
    }
  }

  return {
    projectRoot,
    engineRoot,
    jsonConfigsDir: 'json_configs',
    componentsDir: 'components',
    actionsDir: 'actions',
    outputDir: 'dist',
    plugins: [],
    routingConfig,
    ...userConfig,
  } as LanderConfig;
}

async function runPlugins(config: LanderConfig, hook: 'onBeforeBuild' | 'onAfterBuild') {
  if (!config.plugins) return;
  for (const plugin of config.plugins) {
    if (plugin[hook]) {
      console.log(`Running plugin hook: ${plugin.name}.${hook}`);
      await plugin[hook]!(config);
    }
  }
}

cli
  .command('dev', 'Start the development server')
  .action(async () => {
    const config = await resolveConfig();
    const generator = new WorkspaceGenerator(config);
    const builder = new Builder(config);

    await runPlugins(config, 'onBeforeBuild');

    console.log('Generating workspace...');
    await generator.generate();

    console.log('Starting dev server...');
    await builder.runAstro('dev');
  });

cli
  .command('build', 'Build the static landing pages')
  .action(async () => {
    const config = await resolveConfig();
    const generator = new WorkspaceGenerator(config);
    const builder = new Builder(config);

    await runPlugins(config, 'onBeforeBuild');

    console.log('Generating workspace...');
    await generator.generate();

    console.log('Building project...');
    await builder.runAstro('build');

    await runPlugins(config, 'onAfterBuild');
  });

cli.help();
cli.parse();
