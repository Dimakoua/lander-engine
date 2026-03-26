import { spawn } from 'child_process';
import path from 'path';
import { LanderConfig } from '@/types/config';

export class Builder {
  private config: LanderConfig;
  private workspaceDir: string;

  constructor(config: LanderConfig) {
    this.config = config;
    this.workspaceDir = path.resolve(config.projectRoot, '.lander-engine');
  }

  /**
   * Invokes an Astro CLI command within the hidden workspace context.
   */
  async runAstro(command: 'dev' | 'build') {
    return new Promise<void>((resolve, reject) => {
      const astroBin = path.resolve(this.config.projectRoot, 'node_modules/.bin/astro');
      
      // Make the config loader run against the real project source, not the hidden workspace copy.
      const jsonConfigsDir = this.config.jsonConfigsDir
        ? path.resolve(this.config.projectRoot, this.config.jsonConfigsDir)
        : path.resolve(this.config.projectRoot, 'json_configs');

      const child = spawn(astroBin, [command], {
        cwd: this.workspaceDir,
        stdio: 'inherit',
        shell: false,
        env: {
          ...process.env,
          LANDER_JSON_CONFIGS_DIR: jsonConfigsDir,
        },
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Astro ${command} failed with exit code ${code}`));
        }
      });
    });
  }

  async logPageSizes() {
    const distDir = path.resolve(this.workspaceDir, 'dist');
    const fs = await import('fs/promises');
    const pathLib = await import('path');

    async function walk(dir: string): Promise<string[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const fullPath = pathLib.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...(await walk(fullPath)));
        } else {
          files.push(fullPath);
        }
      }
      return files;
    }

    try {
      const allFiles = await walk(distDir);
      const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
      if (htmlFiles.length === 0) {
        console.log('No generated HTML pages found to report sizes.');
        return;
      }

      let totalSize = 0;
      console.log('Generated page sizes:');
      for (const file of htmlFiles) {
        const stats = await fs.stat(file);
        const size = stats.size;
        totalSize += size;

        const relativePath = pathLib.relative(distDir, file).replace(/\\/g, '/');
        const kb = (size / 1024).toFixed(2);
        console.log(` - /${relativePath} (${kb} KB)`);
      }

      console.log(`Total HTML size: ${(totalSize / 1024).toFixed(2)} KB`);
    } catch (err) {
      console.warn('Could not compute page sizes:', err);
    }
  }
}

