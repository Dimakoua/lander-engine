#!/usr/bin/env node

// src/cli/index.ts
import { cac } from "cac";
import path3 from "path";
import fs2 from "fs-extra";

// src/cli/generate.ts
import fs from "fs-extra";
import path from "path";
import glob from "fast-glob";
import { pathToFileURL } from "url";
var WorkspaceGenerator = class {
  config;
  workspaceDir;
  constructor(config) {
    this.config = config;
    this.workspaceDir = path.resolve(config.projectRoot, ".lander-engine");
  }
  /**
   * Initializes the hidden workspace.
   */
  async generate() {
    await fs.ensureDir(this.workspaceDir);
    const templateDir = path.resolve(this.config.engineRoot, "templates/astro-base");
    if (await fs.pathExists(templateDir)) {
      await fs.emptyDir(this.workspaceDir);
      try {
        await fs.copy(templateDir, this.workspaceDir, {
          overwrite: true,
          dereference: true
        });
        const compressorPath = this.resolvePackage("astro-compressor");
        const configPath = path.join(this.workspaceDir, "astro.config.mjs");
        let configContent = await fs.readFile(configPath, "utf8");
        configContent = configContent.replace("{{ASTRO_COMPRESSOR_PATH}}", compressorPath);
        await fs.writeFile(configPath, configContent);
      } catch (copyErr) {
        console.error("Failed to copy Astro template:", copyErr);
        throw new Error(`Failed to initialize workspace: ${copyErr instanceof Error ? copyErr.message : String(copyErr)}`);
      }
    } else {
      throw new Error(`Lander Engine template not found at ${templateDir}. This usually means the lander-engine package installation is incomplete or corrupted.`);
    }
    await this.generateRegistryManifest();
    await this.generateDomainRouting();
  }
  /**
   * Resolves a package path relative to the engine root as a file URL.
   */
  resolvePackage(packageName) {
    try {
      const packagePath = path.join(this.config.engineRoot, "node_modules", packageName);
      if (fs.existsSync(packagePath)) {
        return pathToFileURL(packagePath).toString();
      }
      return packageName;
    } catch {
      return packageName;
    }
  }
  /**
   * Scans user directories and generates a manifest for the runtime registry.
   */
  async generateRegistryManifest() {
    const componentsDir = path.resolve(this.config.projectRoot, this.config.componentsDir || "components");
    const actionsDir = path.resolve(this.config.projectRoot, this.config.actionsDir || "actions");
    const componentFiles = await glob("**/*.{tsx,jsx,astro,vue,svelte}", { cwd: componentsDir });
    const actionFiles = await glob("**/*.{ts,js}", { cwd: actionsDir });
    let manifestContent = `// Auto-generated manifest
`;
    manifestContent += `import { registry } from 'lander-engine/core';

`;
    let astroRegistryContent = `---
// Auto-generated Astro Registry
`;
    let componentIndex = 0;
    componentFiles.forEach((file) => {
      const name = path.basename(file, path.extname(file));
      const importPath = path.resolve(componentsDir, file).replace(/\\/g, "/");
      astroRegistryContent += `import Component_${componentIndex} from '${importPath}';
`;
      manifestContent += `import Component_${componentIndex} from '${importPath}';
`;
      manifestContent += `registry.registerComponent('${name}', Component_${componentIndex});
`;
      componentIndex++;
    });
    actionFiles.forEach((file, index) => {
      const name = path.basename(file, path.extname(file));
      const importPath = path.resolve(actionsDir, file).replace(/\\/g, "/");
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
      const name = path.basename(file, path.extname(file));
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
    const manifestPath = path.join(this.workspaceDir, "src/registry-manifest.ts");
    const astroRegistryPath = path.join(this.workspaceDir, "src/Registry.astro");
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
  async generateDomainRouting() {
    const routingConfig = this.config.routingConfig;
    if (!routingConfig || Object.keys(routingConfig).length === 0) return;
    const jsonConfigsDir = path.resolve(
      this.config.projectRoot,
      this.config.jsonConfigsDir || "json_configs"
    );
    const domainPaths = {};
    for (const [domain, campaignId] of Object.entries(routingConfig)) {
      try {
        const flow = await fs.readJson(path.join(jsonConfigsDir, campaignId, "flow.json"));
        const initialStep = flow.initialStep || "main";
        domainPaths[domain] = `/${campaignId}/${initialStep}`;
      } catch {
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
    await fs.ensureDir(path.join(this.workspaceDir, "src/pages"));
    await fs.ensureDir(path.join(this.workspaceDir, "public"));
    await fs.writeFile(path.join(this.workspaceDir, "src/pages/index.astro"), indexAstro);
    await fs.writeFile(path.join(this.workspaceDir, "public/_redirects"), netlifyRedirects);
    await fs.writeFile(path.join(this.workspaceDir, "public/vercel.json"), vercelJson);
    console.log(`Domain routing configured for ${Object.keys(domainPaths).length} domain(s).`);
  }
};

// src/cli/build.ts
import { spawn } from "child_process";
import path2 from "path";
var Builder = class {
  config;
  workspaceDir;
  constructor(config) {
    this.config = config;
    this.workspaceDir = path2.resolve(config.projectRoot, ".lander-engine");
  }
  /**
   * Invokes an Astro CLI command within the hidden workspace context.
   */
  async runAstro(command) {
    return new Promise((resolve, reject) => {
      const astroBin = path2.resolve(this.config.projectRoot, "node_modules/.bin/astro");
      const jsonConfigsDir = this.config.jsonConfigsDir ? path2.resolve(this.config.projectRoot, this.config.jsonConfigsDir) : path2.resolve(this.config.projectRoot, "json_configs");
      const child = spawn(astroBin, [command], {
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
    const distDir = path2.resolve(this.workspaceDir, "dist");
    const fs3 = await import("fs/promises");
    const pathLib = await import("path");
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
      console.log("\nGenerated page sizes:");
      let totalRaw = 0;
      let totalGzip = 0;
      let totalBrotli = 0;
      for (const file of htmlFiles) {
        const stats = await fs3.stat(file);
        const rawSize = stats.size;
        totalRaw += rawSize;
        const relativePath = pathLib.relative(distDir, file).replace(/\\/g, "/");
        let gzipSize = null;
        let brotliSize = null;
        try {
          const gzStats = await fs3.stat(file + ".gz");
          gzipSize = gzStats.size;
          totalGzip += gzipSize;
        } catch {
        }
        try {
          const brStats = await fs3.stat(file + ".br");
          brotliSize = brStats.size;
          totalBrotli += brotliSize;
        } catch {
        }
        const rawKb = (rawSize / 1024).toFixed(2);
        let info = ` - /${relativePath} (${rawKb} KB)`;
        if (brotliSize) {
          const brKb = (brotliSize / 1024).toFixed(2);
          const ratio = ((1 - brotliSize / rawSize) * 100).toFixed(0);
          info += ` \u2192 Brotli: ${brKb} KB (-${ratio}%)`;
        } else if (gzipSize) {
          const gzKb = (gzipSize / 1024).toFixed(2);
          const ratio = ((1 - gzipSize / rawSize) * 100).toFixed(0);
          info += ` \u2192 Gzip: ${gzKb} KB (-${ratio}%)`;
        }
        console.log(info);
      }
      console.log("---");
      console.log(`Total HTML Raw:    ${(totalRaw / 1024).toFixed(2)} KB`);
      if (totalBrotli > 0) {
        console.log(`Total HTML Brotli: ${(totalBrotli / 1024).toFixed(2)} KB (-${((1 - totalBrotli / totalRaw) * 100).toFixed(0)}%)`);
      } else if (totalGzip > 0) {
        console.log(`Total HTML Gzip:   ${(totalGzip / 1024).toFixed(2)} KB (-${((1 - totalGzip / totalRaw) * 100).toFixed(0)}%)`);
      }
      console.log("");
    } catch (err) {
      console.warn("Could not compute page sizes:", err);
    }
  }
  /**
   * Starts a preview server for the built project with compression support.
   */
  async preview(port = 4321) {
    const distDir = path2.resolve(this.workspaceDir, "dist");
    const fs3 = await import("fs");
    if (!fs3.existsSync(distDir)) {
      throw new Error(`Build directory not found at ${distDir}. Run 'lander build' first.`);
    }
    const sirv = (await import("sirv")).default;
    const http = await import("http");
    const server = sirv(distDir, {
      dev: false,
      gzip: true,
      brotli: true,
      single: false,
      dotfiles: true
    });
    http.createServer(server).listen(port, (err) => {
      if (err) throw err;
      console.log(`
\u{1F680} Preview server running at http://localhost:${port}`);
      console.log(`Serving with Gzip and Brotli support from: ${distDir}
`);
    });
  }
};

// src/cli/index.ts
import { fileURLToPath } from "url";
import { dirname } from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var cli = cac("lander");
async function resolveConfig() {
  const projectRoot = process.cwd();
  const engineRoot = path3.resolve(__dirname, "../../");
  const configPath = path3.resolve(projectRoot, "lander.config.js");
  let userConfig = {};
  if (await fs2.pathExists(configPath)) {
    try {
      const module = await import(configPath);
      userConfig = module.default || module;
    } catch (e) {
      console.warn("Failed to load lander.config.js, using defaults");
    }
  }
  let routingConfig;
  const routingConfigPath = path3.resolve(projectRoot, "routing.config.js");
  if (await fs2.pathExists(routingConfigPath)) {
    try {
      const module = await import(routingConfigPath);
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
cli.command("preview", "Serve the built production project with compression support").option("--port <port>", "Port to run the preview server on", { default: 4321 }).action(async (options) => {
  const config = await resolveConfig();
  const builder = new Builder(config);
  await builder.preview(options.port);
});
cli.help();
cli.parse();
//# sourceMappingURL=index.js.map