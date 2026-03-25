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
    try {
      await fs.ensureDir(this.workspaceDir);

      // 1. Copy/Link Astro Base Template
      const templateDir = path.resolve(this.config.engineRoot, 'templates/astro-base');
      if (!(await fs.pathExists(templateDir))) {
        throw new Error(`Astro base template not found at: ${templateDir}`);
      }

      // Clean target directory first to avoid stale files
      await fs.emptyDir(this.workspaceDir);
      await fs.copy(templateDir, this.workspaceDir, {
        overwrite: true,
        dereference: true,
        filter: (src) => !src.includes('node_modules'),
      });

      // 2. Generate Registry Manifest
      await this.generateRegistryManifest();

      console.log('✓ Workspace generated successfully');
    } catch (error) {
      throw new Error(
        `Failed to generate workspace: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Converts an absolute file path to a relative import path from the workspace.
   * From: /Users/dima/projects/my-project/components/Button.tsx
   * To: ../components/Button
   */
  private getImportPath(filePath: string, baseDir: string): string {
    // Get relative path from projectRoot to file
    const relativePath = path.relative(this.config.projectRoot, filePath);
    // Remove file extension for imports
    const withoutExt = relativePath.replace(/\.[^/.]+$/, '');
    // Normalize to forward slashes
    const normalized = withoutExt.replace(/\\/g, '/');
    // Make relative from workspace (.lander-engine)
    return `../${normalized}`;
  }

  /**
   * Extracts a unique component name from file path.
   * Handles nested directories by joining with dash.
   */
  private getComponentName(filePath: string): string {
    // Get filename without extension
    let name = path.basename(filePath, path.extname(filePath));
    // Get any parent directories (for nested components)
    const dir = path.dirname(filePath);
    if (dir && dir !== '.') {
      // Join directory parts with dash, normalize separators
      const dirParts = dir
        .replace(/\\/g, '/')
        .split('/')
        .filter((p) => p);
      name = [...dirParts, name].join('-');
    }
    return name;
  }

  /**
   * Scans user directories and generates a manifest for the runtime registry.
   */
  private async generateRegistryManifest() {
    const componentsDir = path.resolve(
      this.config.projectRoot,
      this.config.componentsDir || 'components'
    );
    const actionsDir = path.resolve(this.config.projectRoot, this.config.actionsDir || 'actions');

    // Check if directories exist (graceful fallback)
    const componentDirExists = await fs.pathExists(componentsDir);
    const actionsDirExists = await fs.pathExists(actionsDir);

    if (!componentDirExists && !actionsDirExists) {
      console.warn(
        `⚠ No components or actions directories found. Expected at:\n` +
          `  - ${componentsDir}\n` +
          `  - ${actionsDir}`
      );
    }

    // Glob patterns exclude common non-component files
    const componentGlobPattern = '**/*.{tsx,jsx,astro,vue,svelte}';
    const actionGlobPattern = '**/*.{ts,js}';
    const excludePatterns = ['**/*.test.*', '**/*.spec.*', '**/index.*', '**/*.d.ts'];

    const componentFiles = componentDirExists
      ? await glob(componentGlobPattern, {
          cwd: componentsDir,
          ignore: excludePatterns,
        })
      : [];

    const actionFiles = actionsDirExists
      ? await glob(actionGlobPattern, {
          cwd: actionsDir,
          ignore: [...excludePatterns, '**/*.d.ts'],
        })
      : [];

    // Generate registry-manifest.ts for runtime registration
    let manifestContent = `// Auto-generated manifest - do not edit\n`;
    manifestContent += `import { registry } from 'lander-engine/core';\n\n`;

    if (componentFiles.length > 0) {
      manifestContent += `// Component Registration\n`;
      componentFiles.forEach((file, index) => {
        const name = this.getComponentName(file);
        const importPath = this.getImportPath(path.resolve(componentsDir, file), componentsDir);
        manifestContent += `import Component_${index} from '${importPath}';\n`;
      });
      manifestContent += `\nregistry.registerComponents({\n`;
      componentFiles.forEach((file, index) => {
        const name = this.getComponentName(file);
        manifestContent += `  '${name}': Component_${index},\n`;
      });
      manifestContent += `});\n\n`;
    }

    if (actionFiles.length > 0) {
      manifestContent += `// Action Registration\n`;
      actionFiles.forEach((file, index) => {
        const importPath = this.getImportPath(path.resolve(actionsDir, file), actionsDir);
        manifestContent += `import * as Actions_${index} from '${importPath}';\n`;
      });
      manifestContent += `\nconst actionHandlers = Object.fromEntries(\n`;
      manifestContent += `  [\n`;
      actionFiles.forEach((file, index) => {
        manifestContent += `    ...Object.entries(Actions_${index}).map(([key, handler]) => [key, handler]),\n`;
      });
      manifestContent += `  ].filter(([, handler]) => typeof handler === 'function')\n`;
      manifestContent += `);\n`;
      manifestContent += `registry.registerActions(actionHandlers);\n`;
    }

    // Generate Registry.astro component for runtime component rendering
    let astroRegistryContent = `---
// Auto-generated Registry Component - do not edit
import { registry } from 'lander-engine/core';

interface Props {
  component: string;
  props?: Record<string, any>;
}

const { component: componentName, props = {} } = Astro.props as Props;
const Component = registry.getComponent(componentName);

if (!Component) {
  throw new Error(\`Component '\${componentName}' not found in registry. Did you register it?\`);
}
---

<Component {...props} />
`;

    const manifestPath = path.join(this.workspaceDir, 'src/registry-manifest.ts');
    const astroRegistryPath = path.join(this.workspaceDir, 'src/Registry.astro');

    await fs.ensureDir(path.dirname(manifestPath));
    await fs.writeFile(manifestPath, manifestContent);
    await fs.writeFile(astroRegistryPath, astroRegistryContent);

    console.log(
      `✓ Registry manifest generated (${componentFiles.length} components, ${actionFiles.length} actions)`
    );
  }
}
