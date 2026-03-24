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
      
      const child = spawn(astroBin, [command], {
        cwd: this.workspaceDir,
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          LANDER_JSON_CONFIGS_DIR: this.config.jsonConfigsDir,
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
}
