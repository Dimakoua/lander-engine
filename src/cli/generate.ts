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

    // 3. Generate domain routing entry point (if routing.config.js is present)
    await this.generateDomainRouting();
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

    let componentIndex = 0;
    
    // Import all components
    componentFiles.forEach((file) => {
      const name = path.basename(file, path.extname(file));
      const importPath = path.resolve(componentsDir, file).replace(/\\/g, '/');
      astroRegistryContent += `import Component_${componentIndex} from '${importPath}';\n`;
      manifestContent += `import Component_${componentIndex} from '${importPath}';\n`;
      manifestContent += `registry.registerComponent('${name}', Component_${componentIndex});\n`;
      componentIndex++;
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

    componentIndex = 0;
    componentFiles.forEach((file) => {
      const name = path.basename(file, path.extname(file));
      const isAstroComponent = file.endsWith('.astro');
      
      if (isAstroComponent) {
        // Astro components don't need client: directive
        astroRegistryContent += `{component === '${name}' && <Component_${componentIndex} {...props} />}\n`;
      } else {
        // React/Vue/Svelte components get client:load
        astroRegistryContent += `{component === '${name}' && <Component_${componentIndex} {...props} client:load />}\n`;
      }
      componentIndex++;
    });

    const manifestPath = path.join(this.workspaceDir, 'src/registry-manifest.ts');
    const astroRegistryPath = path.join(this.workspaceDir, 'src/Registry.astro');
    
    await fs.ensureDir(path.dirname(manifestPath));
    await fs.writeFile(manifestPath, manifestContent);
    await fs.writeFile(astroRegistryPath, astroRegistryContent);
  }

  /**
   * Generates domain-to-campaign routing artifacts from routing.config.js.
   *
   * Produces three outputs:
   *  - src/pages/index.astro  — universal client-side domain redirect (works on any static host)
   *  - public/_redirects      — Netlify host-based redirect rules
   *  - public/vercel.json     — Vercel host-based redirect rules
   */
  private async generateDomainRouting() {
    const routingConfig = this.config.routingConfig;
    if (!routingConfig || Object.keys(routingConfig).length === 0) return;

    const jsonConfigsDir = path.resolve(
      this.config.projectRoot,
      this.config.jsonConfigsDir || 'json_configs'
    );

    // Resolve domain → full path by reading each campaign's initialStep from flow.json
    const domainPaths: Record<string, string> = {};
    for (const [domain, campaignId] of Object.entries(routingConfig)) {
      try {
        const flow = await fs.readJson(path.join(jsonConfigsDir, campaignId, 'flow.json'));
        const initialStep = flow.initialStep || 'main';
        domainPaths[domain] = `/${campaignId}/${initialStep}`;
      } catch {
        console.warn(
          `routing.config.js: could not read flow.json for campaign "${campaignId}" (domain: ${domain}), falling back to /${campaignId}`
        );
        domainPaths[domain] = `/${campaignId}`;
      }
    }

    // --- 1. src/pages/index.astro (universal — works on any static host) ---
    const domainMapJson = JSON.stringify(domainPaths, null, 2);
    const indexAstro = `---
// Auto-generated by lander-engine — domain routing entry point
// Redirects each domain to its configured campaign's initial step.
---
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting...</title>
  </head>
  <body>
    <script>
      (function () {
        var domainMap = ${domainMapJson};
        var host = window.location.hostname;
        var target = domainMap[host];
        if (target) {
          window.location.replace(target + window.location.search);
        }
      })();
    </script>
    <noscript>Please enable JavaScript to use this site.</noscript>
  </body>
</html>
`;

    // --- 2. public/_redirects (Netlify) ---
    let netlifyRedirects = `# Lander Engine — domain routing (auto-generated)\n`;
    for (const [domain, targetPath] of Object.entries(domainPaths)) {
      netlifyRedirects += `/  ${targetPath}  302!  Host=${domain}\n`;
    }

    // --- 3. public/vercel.json (Vercel) ---
    const vercelRedirects = Object.entries(domainPaths).map(([domain, targetPath]) => ({
      source: '/',
      destination: targetPath,
      has: [{ type: 'host', value: domain }],
      permanent: false,
    }));
    const vercelJson = JSON.stringify({ redirects: vercelRedirects }, null, 2);

    await fs.ensureDir(path.join(this.workspaceDir, 'src/pages'));
    await fs.ensureDir(path.join(this.workspaceDir, 'public'));

    await fs.writeFile(path.join(this.workspaceDir, 'src/pages/index.astro'), indexAstro);
    await fs.writeFile(path.join(this.workspaceDir, 'public/_redirects'), netlifyRedirects);
    await fs.writeFile(path.join(this.workspaceDir, 'public/vercel.json'), vercelJson);

    console.log(`Domain routing configured for ${Object.keys(domainPaths).length} domain(s).`);
  }
}
