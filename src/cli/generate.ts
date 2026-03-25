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
    const templateDir = path.resolve(this.config.engineRoot, 'templates/astro-base');
    if (await fs.pathExists(templateDir)) {
      // Clean target directory first to avoid stale files
      await fs.emptyDir(this.workspaceDir);
      await fs.copy(templateDir, this.workspaceDir, {
        overwrite: true,
        dereference: true,
        filter: (src) => !src.includes('node_modules'),
      });
    }

    // 2. Generate Registry Manifest
    await this.generateRegistryManifest();
  }

  /**
   * Scans user directories and generates a manifest for the runtime registry.
   */
  private async generateRegistryManifest() {
    const componentsDir = path.resolve(this.config.projectRoot, this.config.componentsDir || 'components');
    const actionsDir = path.resolve(this.config.projectRoot, this.config.actionsDir || 'actions');

    const componentFiles = await glob('**/*.{tsx,jsx,astro,vue,svelte}', { cwd: componentsDir });
    const actionFiles = await glob('**/*.{ts,js}', { cwd: actionsDir });

    // 1. Generate core registry manifest (for actions and general registry)
    let manifestContent = `// Auto-generated manifest\n`;
    manifestContent += `import { registry } from 'lander-engine/core';\n\n`;

    // 2. Generate Registry.astro for static component mapping (Astro needs static imports for Islands)
    let astroRegistryContent = `---
// Auto-generated Astro Registry\n`;

    componentFiles.forEach((file, index) => {
      const name = path.basename(file, path.extname(file));
      const importPath = path.resolve(componentsDir, file).replace(/\\/g, '/');
      astroRegistryContent += `import Component_${index} from '${importPath}';\n`;
      manifestContent += `import Component_${index} from '${importPath}';\n`;
      manifestContent += `registry.registerComponent('${name}', Component_${index});\n`;
    });

    actionFiles.forEach((file, index) => {
      const name = path.basename(file, path.extname(file));
      const importPath = path.resolve(actionsDir, file).replace(/\\/g, '/');
      manifestContent += `import * as Action_${index} from '${importPath}';\n`;
      manifestContent += `registry.registerActions(Action_${index});\n`;
    });

    astroRegistryContent += `
const { component, props } = Astro.props;
---
`;

    componentFiles.forEach((file, index) => {
      const name = path.basename(file, path.extname(file));
      astroRegistryContent += `{component === '${name}' && <Component_${index} {...props} client:load />}\n`;
    });

    const manifestPath = path.join(this.workspaceDir, 'src/registry-manifest.ts');
    const astroRegistryPath = path.join(this.workspaceDir, 'src/Registry.astro');
    
    await fs.ensureDir(path.dirname(manifestPath));
    await fs.writeFile(manifestPath, manifestContent);
    await fs.writeFile(astroRegistryPath, astroRegistryContent);
  }
}
