import fs from 'fs-extra';
import path from 'path';
import glob from 'fast-glob';
import { LanderConfig } from '@/types/config';

export class WorkspaceGenerator {
  private config: LanderConfig;
  private workspaceDir: string;

  constructor(config: LanderConfig) {
    this.config = config;
    this.workspaceDir = path.resolve(config.projectRoot, '.lander-engine');
  }

  /**
   * Initializes the hidden workspace.
   */
  async generate() {
    await fs.ensureDir(this.workspaceDir);

    // 1. Copy/Link Astro Base Template
    // In a real npm package, these templates would be in the package folder.
    // For now, we assume they are in the project root/templates.
    const templateDir = path.resolve(this.config.projectRoot, 'templates/astro-base');
    if (await fs.pathExists(templateDir)) {
      await fs.copy(templateDir, this.workspaceDir, {
        overwrite: true,
        filter: (src) => !src.includes('node_modules'),
      });
    }

    // 2. Generate Registry Manifest
    await this.generateRegistryManifest();

    // 3. Generate Public/Static Assets symlink if needed
    // ...
  }

  /**
   * Scans user directories and generates a manifest for the runtime registry.
   */
  private async generateRegistryManifest() {
    const componentsDir = path.resolve(this.config.projectRoot, this.config.componentsDir || 'components');
    const actionsDir = path.resolve(this.config.projectRoot, this.config.actionsDir || 'actions');

    const componentFiles = await glob('**/*.{tsx,jsx,astro,vue,svelte}', { cwd: componentsDir });
    const actionFiles = await glob('**/*.{ts,js}', { cwd: actionsDir });

    let manifestContent = `// Auto-generated manifest\n`;
    manifestContent += `import { registry } from 'lander-engine/core';\n\n`;

    // Import Components
    componentFiles.forEach((file, index) => {
      const name = path.basename(file, path.extname(file));
      const importPath = path.resolve(componentsDir, file).replace(/\\/g, '/');
      manifestContent += `import Component_${index} from '${importPath}';\n`;
      manifestContent += `registry.registerComponent('${name}', Component_${index});\n`;
    });

    // Import Actions
    actionFiles.forEach((file, index) => {
      const name = path.basename(file, path.extname(file));
      const importPath = path.resolve(actionsDir, file).replace(/\\/g, '/');
      manifestContent += `import * as Action_${index} from '${importPath}';\n`;
      manifestContent += `registry.registerActions(Action_${index});\n`;
    });

    const manifestPath = path.join(this.workspaceDir, 'src/registry-manifest.ts');
    await fs.ensureDir(path.dirname(manifestPath));
    await fs.writeFile(manifestPath, manifestContent);
  }
}
