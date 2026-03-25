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
   * Properly passes environment variables and handles errors.
   */
  async runAstro(command: 'dev' | 'build'): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Resolve astro binary from project's node_modules
        const astroBin = path.resolve(this.config.projectRoot, 'node_modules/.bin/astro');

        // Resolve JSON configs directory from the project root
        const jsonConfigsDir = this.config.jsonConfigsDir
          ? path.resolve(this.config.projectRoot, this.config.jsonConfigsDir)
          : path.resolve(this.config.projectRoot, 'json_configs');

        // Prepare environment variables
        const env: Record<string, string> = {
          ...process.env,
          LANDER_JSON_CONFIGS_DIR: jsonConfigsDir,
          LANDER_PROJECT_ROOT: this.config.projectRoot,
          LANDER_ENGINE_ROOT: this.config.engineRoot,
        };

        console.log(`Running: astro ${command}`);
        console.log(`Workspace: ${this.workspaceDir}`);
        console.log(`Config Dir: ${jsonConfigsDir}`);

        // Spawn astro process
        const child = spawn(astroBin, [command], {
          cwd: this.workspaceDir,
          stdio: 'inherit',
          shell: true,
          env,
        });

        child.on('error', (error) => {
          reject(
            new Error(
              `Failed to spawn Astro process: ${error.message}\n` +
                `Astro binary not found at: ${astroBin}\n` +
                `Make sure Astro is installed: npm install astro`
            )
          );
        });

        child.on('close', (code) => {
          if (code === 0) {
            console.log(`✓ Astro ${command} completed successfully`);
            resolve();
          } else {
            reject(
              new Error(
                `Astro ${command} failed with exit code ${code}\n` +
                  `Try running 'npm install' to ensure all dependencies are installed.`
              )
            );
          }
        });
      } catch (error) {
        reject(
          new Error(
            `Error running Astro: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    });
  }
}
