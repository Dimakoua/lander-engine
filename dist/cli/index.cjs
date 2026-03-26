#!/usr/bin/env node
"use strict"; function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// src/cli/index.ts
var _cac = require('cac');
var _path = require('path'); var _path2 = _interopRequireDefault(_path);
var _fsextra = require('fs-extra'); var _fsextra2 = _interopRequireDefault(_fsextra);

// src/cli/generate.ts


var _fastglob = require('fast-glob'); var _fastglob2 = _interopRequireDefault(_fastglob);
var WorkspaceGenerator = class {
  
  
  constructor(config) {
    this.config = config;
    this.workspaceDir = _path2.default.resolve(config.projectRoot, ".lander-engine");
  }
  /**
   * Initializes the hidden workspace.
   */
  async generate() {
    await _fsextra2.default.ensureDir(this.workspaceDir);
    const templateDir = _path2.default.resolve(this.config.engineRoot, "templates/astro-base");
    if (await _fsextra2.default.pathExists(templateDir)) {
      await _fsextra2.default.emptyDir(this.workspaceDir);
      await _fsextra2.default.copy(templateDir, this.workspaceDir, {
        overwrite: true,
        dereference: true,
        filter: (src) => !src.includes("node_modules")
      });
    }
    await this.generateRegistryManifest();
    await this.generateDomainRouting();
  }
  /**
   * Scans user directories and generates a manifest for the runtime registry.
   */
  async generateRegistryManifest() {
    const componentsDir = _path2.default.resolve(this.config.projectRoot, this.config.componentsDir || "components");
    const actionsDir = _path2.default.resolve(this.config.projectRoot, this.config.actionsDir || "actions");
    const componentFiles = await _fastglob2.default.call(void 0, "**/*.{tsx,jsx,astro,vue,svelte}", { cwd: componentsDir });
    const actionFiles = await _fastglob2.default.call(void 0, "**/*.{ts,js}", { cwd: actionsDir });
    let manifestContent = `// Auto-generated manifest
`;
    manifestContent += `import { registry } from 'lander-engine/core';

`;
    let astroRegistryContent = `---
// Auto-generated Astro Registry
`;
    let componentIndex = 0;
    componentFiles.forEach((file) => {
      const name = _path2.default.basename(file, _path2.default.extname(file));
      const importPath = _path2.default.resolve(componentsDir, file).replace(/\\/g, "/");
      astroRegistryContent += `import Component_${componentIndex} from '${importPath}';
`;
      manifestContent += `import Component_${componentIndex} from '${importPath}';
`;
      manifestContent += `registry.registerComponent('${name}', Component_${componentIndex});
`;
      componentIndex++;
    });
    actionFiles.forEach((file, index) => {
      const name = _path2.default.basename(file, _path2.default.extname(file));
      const importPath = _path2.default.resolve(actionsDir, file).replace(/\\/g, "/");
      manifestContent += `import * as Action_${index} from '${importPath}';
`;
      manifestContent += `registry.registerActions(Action_${index});
`;
    });
    astroRegistryContent += `
const { component, props } = Astro.props;
---
`;
    componentIndex = 0;
    componentFiles.forEach((file) => {
      const name = _path2.default.basename(file, _path2.default.extname(file));
      const isAstroComponent = file.endsWith(".astro");
      if (isAstroComponent) {
        astroRegistryContent += `{component === '${name}' && <Component_${componentIndex} {...props} />}
`;
      } else {
        astroRegistryContent += `{component === '${name}' && <Component_${componentIndex} {...props} client:load />}
`;
      }
      componentIndex++;
    });
    const manifestPath = _path2.default.join(this.workspaceDir, "src/registry-manifest.ts");
    const astroRegistryPath = _path2.default.join(this.workspaceDir, "src/Registry.astro");
    await _fsextra2.default.ensureDir(_path2.default.dirname(manifestPath));
    await _fsextra2.default.writeFile(manifestPath, manifestContent);
    await _fsextra2.default.writeFile(astroRegistryPath, astroRegistryContent);
  }
  /**
   * Generates domain-to-campaign routing artifacts from routing.config.js.
   *
   * Produces three outputs:
   *  - src/pages/index.astro  — universal client-side domain redirect (works on any static host)
   *  - public/_redirects      — Netlify host-based redirect rules
   *  - public/vercel.json     — Vercel host-based redirect rules
   */
  async generateDomainRouting() {
    const routingConfig = this.config.routingConfig;
    if (!routingConfig || Object.keys(routingConfig).length === 0) return;
    const jsonConfigsDir = _path2.default.resolve(
      this.config.projectRoot,
      this.config.jsonConfigsDir || "json_configs"
    );
    const domainPaths = {};
    for (const [domain, campaignId] of Object.entries(routingConfig)) {
      try {
        const flow = await _fsextra2.default.readJson(_path2.default.join(jsonConfigsDir, campaignId, "flow.json"));
        const initialStep = flow.initialStep || "main";
        domainPaths[domain] = `/${campaignId}/${initialStep}`;
      } catch (e2) {
        console.warn(
          `routing.config.js: could not read flow.json for campaign "${campaignId}" (domain: ${domain}), falling back to /${campaignId}`
        );
        domainPaths[domain] = `/${campaignId}`;
      }
    }
    const domainMapJson = JSON.stringify(domainPaths, null, 2);
    const indexAstro = `---
// Auto-generated by lander-engine \u2014 domain routing entry point
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
    let netlifyRedirects = `# Lander Engine \u2014 domain routing (auto-generated)
`;
    for (const [domain, targetPath] of Object.entries(domainPaths)) {
      netlifyRedirects += `/  ${targetPath}  302!  Host=${domain}
`;
    }
    const vercelRedirects = Object.entries(domainPaths).map(([domain, targetPath]) => ({
      source: "/",
      destination: targetPath,
      has: [{ type: "host", value: domain }],
      permanent: false
    }));
    const vercelJson = JSON.stringify({ redirects: vercelRedirects }, null, 2);
    await _fsextra2.default.ensureDir(_path2.default.join(this.workspaceDir, "src/pages"));
    await _fsextra2.default.ensureDir(_path2.default.join(this.workspaceDir, "public"));
    await _fsextra2.default.writeFile(_path2.default.join(this.workspaceDir, "src/pages/index.astro"), indexAstro);
    await _fsextra2.default.writeFile(_path2.default.join(this.workspaceDir, "public/_redirects"), netlifyRedirects);
    await _fsextra2.default.writeFile(_path2.default.join(this.workspaceDir, "public/vercel.json"), vercelJson);
    console.log(`Domain routing configured for ${Object.keys(domainPaths).length} domain(s).`);
  }
};

// src/cli/build.ts
var _child_process = require('child_process');

var Builder = class {
  
  
  constructor(config) {
    this.config = config;
    this.workspaceDir = _path2.default.resolve(config.projectRoot, ".lander-engine");
  }
  /**
   * Invokes an Astro CLI command within the hidden workspace context.
   */
  async runAstro(command) {
    return new Promise((resolve, reject) => {
      const astroBin = _path2.default.resolve(this.config.projectRoot, "node_modules/.bin/astro");
      const jsonConfigsDir = this.config.jsonConfigsDir ? _path2.default.resolve(this.config.projectRoot, this.config.jsonConfigsDir) : _path2.default.resolve(this.config.projectRoot, "json_configs");
      const child = _child_process.spawn.call(void 0, astroBin, [command], {
        cwd: this.workspaceDir,
        stdio: "inherit",
        shell: false,
        env: {
          ...process.env,
          LANDER_JSON_CONFIGS_DIR: jsonConfigsDir
        }
      });
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Astro ${command} failed with exit code ${code}`));
        }
      });
    });
  }
  async logPageSizes() {
    const distDir = _path2.default.resolve(this.workspaceDir, "dist");
    const fs3 = await Promise.resolve().then(() => _interopRequireWildcard(require("fs/promises")));
    const pathLib = await Promise.resolve().then(() => _interopRequireWildcard(require("path")));
    async function walk(dir) {
      const entries = await fs3.readdir(dir, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const fullPath = pathLib.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...await walk(fullPath));
        } else {
          files.push(fullPath);
        }
      }
      return files;
    }
    try {
      const allFiles = await walk(distDir);
      const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));
      if (htmlFiles.length === 0) {
        console.log("No generated HTML pages found to report sizes.");
        return;
      }
      let totalSize = 0;
      console.log("Generated page sizes:");
      for (const file of htmlFiles) {
        const stats = await fs3.stat(file);
        const size = stats.size;
        totalSize += size;
        const relativePath = pathLib.relative(distDir, file).replace(/\\/g, "/");
        const kb = (size / 1024).toFixed(2);
        console.log(` - /${relativePath} (${kb} KB)`);
      }
      console.log(`Total HTML size: ${(totalSize / 1024).toFixed(2)} KB`);
    } catch (err) {
      console.warn("Could not compute page sizes:", err);
    }
  }
};

// src/cli/index.ts
var _url = require('url');

var __filename = _url.fileURLToPath.call(void 0, import.meta.url);
var __dirname = _path.dirname.call(void 0, __filename);
var cli = _cac.cac.call(void 0, "lander");
async function resolveConfig() {
  const projectRoot = process.cwd();
  const engineRoot = _path2.default.resolve(__dirname, "../../");
  const configPath = _path2.default.resolve(projectRoot, "lander.config.js");
  let userConfig = {};
  if (await _fsextra2.default.pathExists(configPath)) {
    try {
      const module = await Promise.resolve().then(() => _interopRequireWildcard(require(configPath)));
      userConfig = module.default || module;
    } catch (e) {
      console.warn("Failed to load lander.config.js, using defaults");
    }
  }
  let routingConfig;
  const routingConfigPath = _path2.default.resolve(projectRoot, "routing.config.js");
  if (await _fsextra2.default.pathExists(routingConfigPath)) {
    try {
      const module = await Promise.resolve().then(() => _interopRequireWildcard(require(routingConfigPath)));
      routingConfig = module.default || module;
    } catch (e) {
      console.warn("Failed to load routing.config.js, domain routing will be skipped");
    }
  }
  return {
    projectRoot,
    engineRoot,
    jsonConfigsDir: "json_configs",
    componentsDir: "components",
    actionsDir: "actions",
    outputDir: "dist",
    plugins: [],
    routingConfig,
    ...userConfig
  };
}
async function runPlugins(config, hook) {
  if (!config.plugins) return;
  for (const plugin of config.plugins) {
    if (plugin[hook]) {
      console.log(`Running plugin hook: ${plugin.name}.${hook}`);
      await plugin[hook](config);
    }
  }
}
cli.command("dev", "Start the development server").action(async () => {
  const config = await resolveConfig();
  const generator = new WorkspaceGenerator(config);
  const builder = new Builder(config);
  await runPlugins(config, "onBeforeBuild");
  console.log("Generating workspace...");
  await generator.generate();
  console.log("Starting dev server...");
  await builder.runAstro("dev");
});
cli.command("build", "Build the static landing pages").action(async () => {
  const config = await resolveConfig();
  const generator = new WorkspaceGenerator(config);
  const builder = new Builder(config);
  await runPlugins(config, "onBeforeBuild");
  console.log("Generating workspace...");
  await generator.generate();
  console.log("Building project...");
  await builder.runAstro("build");
  await builder.logPageSizes();
  await runPlugins(config, "onAfterBuild");
});
cli.help();
cli.parse();
//# sourceMappingURL=index.cjs.map