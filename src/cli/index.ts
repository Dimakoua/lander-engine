import { cac } from 'cac';
import path from 'path';
import { WorkspaceGenerator } from './generate';
import { Builder } from './build';
import { LanderConfig } from '@/types/config';

const cli = cac('lander');

async function resolveConfig(): Promise<LanderConfig> {
  const projectRoot = process.cwd();
  // Future: load lander.config.ts
  return {
    projectRoot,
    jsonConfigsDir: 'json_configs',
    componentsDir: 'components',
    actionsDir: 'actions',
    outputDir: 'dist',
  };
}

cli
  .command('dev', 'Start the development server')
  .action(async () => {
    const config = await resolveConfig();
    const generator = new WorkspaceGenerator(config);
    const builder = new Builder(config);

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

    console.log('Generating workspace...');
    await generator.generate();

    console.log('Building project...');
    await builder.runAstro('build');
  });

cli.help();
cli.parse();
