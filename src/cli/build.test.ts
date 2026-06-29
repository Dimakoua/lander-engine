import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Builder } from './build';
import path from 'path';
import * as child_process from 'child_process';
import { spawn } from 'child_process';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as http from 'http';

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    spawn: vi.fn(),
  };
});

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    readdir: vi.fn(),
    stat: vi.fn(),
  };
});

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

vi.mock('http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('http')>();
  return {
    ...actual,
    createServer: vi.fn(),
  };
});

// Mock sirv for preview test
vi.mock('sirv', () => {
  return {
    default: vi.fn(() => 'mock_sirv_handler')
  };
});

describe('Builder', () => {
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
      plugins: [],
    };
    workspaceDir = path.resolve(config.projectRoot, '.lander-engine');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logPageSizes', () => {
    it('should log sizes for html files', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (fsPromises.readdir as any).mockImplementation((dir: string) => {
        if (dir.endsWith('dist')) {
          return Promise.resolve([
            { name: 'index.html', isDirectory: () => false },
            { name: 'sub', isDirectory: () => true },
          ]);
        }
        if (dir.endsWith('sub')) {
          return Promise.resolve([
            { name: 'page.html', isDirectory: () => false },
            { name: 'image.png', isDirectory: () => false }, // Not html
          ]);
        }
        return Promise.resolve([]);
      });

      (fsPromises.stat as any).mockImplementation((file: string) => {
        if (file.endsWith('index.html')) return Promise.resolve({ size: 10240 }); // 10KB
        if (file.endsWith('index.html.gz')) return Promise.resolve({ size: 2048 }); // 2KB
        if (file.endsWith('index.html.br')) return Promise.reject(new Error('No brotli'));

        if (file.endsWith('page.html')) return Promise.resolve({ size: 20480 }); // 20KB
        if (file.endsWith('page.html.gz')) return Promise.reject(new Error('No gzip'));
        if (file.endsWith('page.html.br')) return Promise.resolve({ size: 1024 }); // 1KB

        return Promise.reject(new Error('File not found'));
      });

      const builder = new Builder(config);
      await builder.logPageSizes();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Generated page sizes:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/index.html'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Gzip: 2.00 KB'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/sub/page.html'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Brotli: 1.00 KB'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total HTML Raw:    30.00 KB'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total HTML Brotli: 1.00 KB'));

      consoleLogSpy.mockRestore();
    });

    it('should handle no html files', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (fsPromises.readdir as any).mockResolvedValue([]);

      const builder = new Builder(config);
      await builder.logPageSizes();

      expect(consoleLogSpy).toHaveBeenCalledWith('No generated HTML pages found to report sizes.');
      consoleLogSpy.mockRestore();
    });
  });

  describe('preview', () => {
    it('should throw if dist dir does not exist', async () => {
      (fs.existsSync as any).mockReturnValue(false);
      const builder = new Builder(config);
      await expect(builder.preview()).rejects.toThrow(/Build directory not found/);
    });

    it('should start preview server', async () => {
      (fs.existsSync as any).mockReturnValue(true);
      const mockServer = { listen: vi.fn((port, callback) => callback()) };
      (http.createServer as any).mockReturnValue(mockServer);
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const builder = new Builder(config);
      await builder.preview(1234);

      expect(http.createServer).toHaveBeenCalledWith('mock_sirv_handler');
      expect(mockServer.listen).toHaveBeenCalledWith(1234, expect.any(Function));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('http://localhost:1234'));

      consoleLogSpy.mockRestore();
    });
  });
});
