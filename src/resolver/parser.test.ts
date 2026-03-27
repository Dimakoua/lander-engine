import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigParser } from './parser';
import fs from 'fs-extra';
import glob from 'fast-glob';
import path from 'path';

vi.mock('fs-extra');
vi.mock('fast-glob');

describe('ConfigParser', () => {
  const baseDir = 'configs';
  let parser: ConfigParser;

  beforeEach(() => {
    vi.clearAllMocks();
    parser = new ConfigParser(baseDir);
  });

  it('should get campaigns', async () => {
    (glob as any).mockResolvedValue(['campaign1', 'campaign2']);
    const campaigns = await parser.getCampaigns();
    expect(campaigns).toEqual(['campaign1', 'campaign2']);
    expect(glob).toHaveBeenCalledWith('*', expect.objectContaining({ cwd: path.resolve(process.cwd(), baseDir) }));
  });

  it('should get variants', async () => {
    (glob as any).mockResolvedValue(['v1', 'v2', 'mobile', 'steps', '.DS_Store']);
    const variants = await parser.getVariants('camp1');
    expect(variants).toEqual(['v1', 'v2']);
  });

  it('should load campaign base', async () => {
    const campaignId = 'test-campaign';
    const mockFlow = { initialStep: 'step1' };
    const mockTheme = { colors: { primary: 'red' } };
    const mockStep = { sections: [] };

    (fs.pathExists as any).mockImplementation((p: string) => {
      if (p.includes('flow.json') || p.includes('theme.json') || p.includes('step1.json')) return true;
      return false;
    });

    (fs.readJson as any).mockImplementation((p: string) => {
      if (p.includes('flow.json')) return mockFlow;
      if (p.includes('theme.json')) return mockTheme;
      if (p.includes('step1.json')) return mockStep;
      return {};
    });

    (glob as any).mockResolvedValue(['test-campaign/steps/step1.json']);

    const config = await parser.loadCampaignBase(campaignId);

    expect(config.campaignId).toBe(campaignId);
    expect(config.flow).toEqual(mockFlow);
    expect(config.theme).toEqual(mockTheme);
    expect(config.steps.step1).toEqual(mockStep);
  });

  it('should throw error if flow.json is missing', async () => {
    (fs.pathExists as any).mockResolvedValue(false);
    await expect(parser.loadCampaignBase('invalid')).rejects.toThrow('Missing mandatory flow.json');
  });

  it('should load overrides', async () => {
    const campaignId = 'test-campaign';
    const mockThemeOverride = { colors: { primary: 'blue' } };

    (fs.pathExists as any).mockImplementation((p: string) => p.includes('v1/theme.json'));
    (fs.readJson as any).mockImplementation((p: string) => {
      if (p.includes('v1/theme.json')) return mockThemeOverride;
      return null;
    });
    (glob as any).mockResolvedValue([]);

    const overrides = await parser.loadOverrides(campaignId, 'v1');
    expect(overrides.theme).toEqual(mockThemeOverride);
    expect(overrides.flow).toBeUndefined();
  });
});
