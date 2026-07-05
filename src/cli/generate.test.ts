import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WorkspaceGenerator } from './generate';
import fs from 'fs-extra';
import path from 'path';
import glob from 'fast-glob';
import os from 'os';

vi.mock('fs-extra');
vi.mock('fast-glob');

describe('WorkspaceGenerator', () => {
  let config: any;
  let workspaceDir: string;

  beforeEach(() => {
    config = {
      projectRoot: '/mock/project',
      engineRoot: '/mock/engine',
      jsonConfigsDir: 'json_configs',
      componentsDir: 'components',
      actionsDir: 'actions',
      outputDir: 'dist',
    };
    workspaceDir = path.resolve(config.projectRoot, 'node_modules/.lander-engine');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateRoutingArtifacts (generateDomainRouting)', () => {
    it('should not generate routing artifacts if routingConfig is empty', async () => {
      config.routingConfig = {};
      const generator = new WorkspaceGenerator(config);
      await (generator as any).generateDomainRouting();

      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should generate redirect routing artifacts (Netlify, Vercel, Astro)', async () => {
      config.routingConfig = {
        'example.com': 'campaign_a',
        'promo.example.com': { campaign: 'campaign_b', renderFromRoot: true },
        'beta.example.com': { campaign: 'campaign_c', defaultStep: 'landing' },
      };

      (fs.readJson as any).mockImplementation((p: string) => {
        if (p.includes('campaign_a')) return { initialStep: 'main' };
        if (p.includes('campaign_b')) return { initialStep: 'index' };
        if (p.includes('campaign_c')) return { initialStep: 'main' };
        throw new Error('Not found');
      });

      const generator = new WorkspaceGenerator(config);
      await (generator as any).generateDomainRouting();

      // Check src/domain-routing.json
      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join(workspaceDir, 'src/domain-routing.json'),
        {
          'example.com': { campaign: 'campaign_a', renderFromRoot: false, defaultStep: undefined },
          'promo.example.com': { campaign: 'campaign_b', renderFromRoot: true, defaultStep: undefined },
          'beta.example.com': { campaign: 'campaign_c', renderFromRoot: false, defaultStep: 'landing' },
        },
        { spaces: 2 }
      );

      // Check netlify redirects
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(workspaceDir, 'public/_redirects'),
        expect.stringContaining('/  /campaign_a/main  302!  Host=example.com')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(workspaceDir, 'public/_redirects'),
        expect.stringContaining('/  /campaign_b/index  200!  Host=promo.example.com')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(workspaceDir, 'public/_redirects'),
        expect.stringContaining('/  /campaign_c/landing  302!  Host=beta.example.com')
      );

      // Check vercel redirects/rewrites
      const vercelCall = (fs.writeFile as any).mock.calls.find((call: any[]) => call[0].endsWith('vercel.json'));
      expect(vercelCall).toBeDefined();
      const vercelJson = JSON.parse(vercelCall[1]);
      expect(vercelJson.redirects).toContainEqual(
        expect.objectContaining({
          source: '/',
          destination: '/campaign_a/main',
          has: [{ type: 'host', value: 'example.com' }],
        })
      );
      expect(vercelJson.rewrites).toContainEqual(
        expect.objectContaining({
          source: '/',
          destination: '/campaign_b/index',
          has: [{ type: 'host', value: 'promo.example.com' }],
        })
      );
    });

    it('should generate index.astro redirector for domain routing', async () => {
      config.routingConfig = {
        'example.com': 'campaign_a',
      };
      (fs.readJson as any).mockResolvedValue({ initialStep: 'main' });

      const generator = new WorkspaceGenerator(config);
      await (generator as any).generateDomainRouting();

      const indexAstroCall = (fs.writeFile as any).mock.calls.find((call: any[]) => call[0].endsWith('src/pages/index.astro'));
      expect(indexAstroCall).toBeDefined();
      expect(indexAstroCall[1]).toContain('var domainMap = {');
      expect(indexAstroCall[1]).toContain('"example.com": {');
    });

    it('should fallback gracefully if flow.json cannot be read', async () => {
      config.routingConfig = {
        'example.com': 'campaign_a',
        'promo.example.com': { campaign: 'campaign_b', renderFromRoot: true },
      };
      (fs.readJson as any).mockRejectedValue(new Error('File not found'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const generator = new WorkspaceGenerator(config);
      await (generator as any).generateDomainRouting();

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('could not read flow.json for campaign "campaign_a"'));

      // Check netlify redirects fallback
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(workspaceDir, 'public/_redirects'),
        expect.stringContaining('/  /campaign_a  302!  Host=example.com')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(workspaceDir, 'public/_redirects'),
        expect.stringContaining('/  /campaign_b  200!  Host=promo.example.com')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('copyAssets', () => {
    it('should copy user assets directory if it exists', async () => {
      (fs.pathExists as any).mockResolvedValue(true);
      const generator = new WorkspaceGenerator(config);
      await (generator as any).copyAssets();

      expect(fs.copy).toHaveBeenCalledWith(
        path.resolve(config.projectRoot, 'assets'),
        path.join(workspaceDir, 'src/assets'),
        { overwrite: true, dereference: true }
      );
    });

    it('should ensure target directory exists if user assets directory does not exist', async () => {
      (fs.pathExists as any).mockResolvedValue(false);
      const generator = new WorkspaceGenerator(config);
      await (generator as any).copyAssets();

      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(workspaceDir, 'src/assets'));
      expect(fs.copy).not.toHaveBeenCalled();
    });
  });

  describe('generateRegistryManifest', () => {
    it('should generate registry manifest with components and actions', async () => {
      (glob as any).mockImplementation((pattern: string, options: any) => {
        if (options.cwd.includes('components')) {
          return Promise.resolve(['Hero.tsx', 'Footer.astro']);
        }
        if (options.cwd.includes('actions')) {
          return Promise.resolve(['analytics.ts']);
        }
        return Promise.resolve([]);
      });

      const generator = new WorkspaceGenerator(config);
      await (generator as any).generateRegistryManifest();

      // Check registry-manifest.ts
      const manifestCall = (fs.writeFile as any).mock.calls.find((call: any[]) => call[0].endsWith('src/registry-manifest.ts'));
      expect(manifestCall).toBeDefined();
      expect(manifestCall[1]).toContain(`import Component_0 from`);
      expect(manifestCall[1]).toContain(`registry.registerComponent('Hero', Component_0);`);
      expect(manifestCall[1]).toContain(`import Component_1 from`);
      expect(manifestCall[1]).toContain(`registry.registerComponent('Footer', Component_1);`);
      expect(manifestCall[1]).toContain(`import * as Action_0 from`);
      expect(manifestCall[1]).toContain(`registry.registerActions(Action_0);`);

      // Check Registry.astro
      const astroCall = (fs.writeFile as any).mock.calls.find((call: any[]) => call[0].endsWith('src/Registry.astro'));
      expect(astroCall).toBeDefined();
      expect(astroCall[1]).toContain(`{component === 'Hero' && <Component_0 {...props} client:load />}`);
      expect(astroCall[1]).toContain(`{component === 'Footer' && <Component_1 {...props} />}`); // Astro component doesn't have client:load
    });
  });

  describe('generateConfigJson', () => {
    it('should generate config json with error pages and redirectPage', async () => {
      config.errorPages = {
        '404': { component: 'Custom404' }
      };
      config.redirectPage = {
        component: 'CustomRedirect',
        theme: { loadingText: 'Redirecting...' }
      };
      const generator = new WorkspaceGenerator(config);
      await (generator as any).generateConfigJson();

      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join(workspaceDir, 'src/lander-config.json'),
        { 
          errorPages: config.errorPages,
          redirectPage: config.redirectPage
        },
        { spaces: 2 }
      );
    });
  });

  describe('generate', () => {
    it('should throw if template directory not found', async () => {
      (fs.pathExists as any).mockResolvedValue(false);
      const generator = new WorkspaceGenerator(config);
      await expect(generator.generate()).rejects.toThrow(/Lander Engine template not found/);
    });

    it('should handle typical generate success', async () => {
      (fs.pathExists as any).mockImplementation((p: string) => p.includes('templates/astro-base'));
      (fs.copy as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue('{{ASTRO_COMPRESSOR_PATH}}');
      (fs.writeFile as any).mockResolvedValue(undefined);

      const generator = new WorkspaceGenerator(config);

      // Stub the other methods so we don't need all the mocks
      (generator as any).copyAssets = vi.fn().mockResolvedValue(undefined);
      (generator as any).generateRegistryManifest = vi.fn().mockResolvedValue(undefined);
      (generator as any).generateDomainRouting = vi.fn().mockResolvedValue(undefined);
      (generator as any).generateConfigJson = vi.fn().mockResolvedValue(undefined);

      await expect(generator.generate()).resolves.toBeUndefined();
    });
  });
});
