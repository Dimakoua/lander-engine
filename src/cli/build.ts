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

      console.log('\nGenerated page sizes:');
      let totalRaw = 0;
      let totalGzip = 0;
      let totalBrotli = 0;

      for (const file of htmlFiles) {
        const stats = await fs.stat(file);
        const rawSize = stats.size;
        totalRaw += rawSize;

        const relativePath = pathLib.relative(distDir, file).replace(/\\/g, '/');
        
        // Check for compressed versions
        let gzipSize: number | null = null;
        let brotliSize: number | null = null;

        try {
          const gzStats = await fs.stat(file + '.gz');
          gzipSize = gzStats.size;
          totalGzip += gzipSize;
        } catch {}

        try {
          const brStats = await fs.stat(file + '.br');
          brotliSize = brStats.size;
          totalBrotli += brotliSize;
        } catch {}

        const rawKb = (rawSize / 1024).toFixed(2);
        let info = ` - /${relativePath} (${rawKb} KB)`;
        
        if (brotliSize) {
          const brKb = (brotliSize / 1024).toFixed(2);
          const ratio = ((1 - brotliSize / rawSize) * 100).toFixed(0);
          info += ` → Brotli: ${brKb} KB (-${ratio}%)`;
        } else if (gzipSize) {
          const gzKb = (gzipSize / 1024).toFixed(2);
          const ratio = ((1 - gzipSize / rawSize) * 100).toFixed(0);
          info += ` → Gzip: ${gzKb} KB (-${ratio}%)`;
        }

        console.log(info);
      }

      console.log('---');
      console.log(`Total HTML Raw:    ${(totalRaw / 1024).toFixed(2)} KB`);
      if (totalBrotli > 0) {
        console.log(`Total HTML Brotli: ${(totalBrotli / 1024).toFixed(2)} KB (-${((1 - totalBrotli / totalRaw) * 100).toFixed(0)}%)`);
      } else if (totalGzip > 0) {
        console.log(`Total HTML Gzip:   ${(totalGzip / 1024).toFixed(2)} KB (-${((1 - totalGzip / totalRaw) * 100).toFixed(0)}%)`);
      }
      console.log('');
    } catch (err) {
      console.warn('Could not compute page sizes:', err);
    }
  }

  /**
   * Starts a preview server for the built project with compression support.
   */
  async preview(port: number = 4321) {
    const distDir = path.resolve(this.workspaceDir, 'dist');
    const fs = await import('fs');

    if (!fs.existsSync(distDir)) {
      throw new Error(`Build directory not found at ${distDir}. Run 'lander build' first.`);
    }

    // Dynamic import to avoid CJS/ESM issues with sirv if necessary, but sirv is standard
    const sirv = (await import('sirv')).default;
    const http = await import('http');

    const server = sirv(distDir, {
      dev: false,
      gzip: true,
      brotli: true,
      single: false,
      dotfiles: true,
    });

    http.createServer(server).listen(port, (err?: any) => {
      if (err) throw err;
      console.log(`\n🚀 Preview server running at http://localhost:${port}`);
      console.log(`Serving with Gzip and Brotli support from: ${distDir}\n`);
    });
  }
}

