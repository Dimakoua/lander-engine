import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigParser, interpolateVariables } from './parser';
import fs from 'fs-extra';
import glob from 'fast-glob';
import path from 'path';

vi.mock('fs-extra');
vi.mock('fast-glob');

describe('interpolateVariables', () => {
  it('should replace exact string match with state value, preserving type', () => {
    const state = { count: 42, active: true, user: { name: 'Alice' } };
    expect(interpolateVariables('{{count}}', state)).toBe(42);
    expect(interpolateVariables('{{active}}', state)).toBe(true);
    expect(interpolateVariables('{{user.name}}', state)).toBe('Alice');
    expect(interpolateVariables('{{user}}', state)).toEqual({ name: 'Alice' });
  });

  it('should interpolate variable within string text', () => {
    const state = { name: 'Bob', score: 100 };
    expect(interpolateVariables('Hello {{name}}, score: {{score}}', state)).toBe('Hello Bob, score: 100');
  });

  it('should handle stringified objects in string text', () => {
    const state = { data: { x: 1 } };
    expect(interpolateVariables('Data: {{data}}', state)).toBe('Data: {"x":1}');
  });

  it('should leave missing keys unchanged and log a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const state = { name: 'Bob' };
    expect(interpolateVariables('Hello {{name}}, age: {{age}}', state)).toBe('Hello Bob, age: {{age}}');
    expect(interpolateVariables('{{missing}}', state)).toBe('{{missing}}');
    expect(warnSpy).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });

  it('should traverse arrays and nested objects', () => {
    const state = { color: 'red', size: 10 };
    const target = {
      title: 'Item {{color}}',
      details: {
        val: '{{size}}',
        tags: ['{{color}}', 'blue']
      }
    };

    const result = interpolateVariables(target, state);

    expect(result).toEqual({
      title: 'Item red',
      details: {
        val: 10,
        tags: ['red', 'blue']
      }
    });
  });
});

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
    const mockState = {};

    (fs.pathExists as any).mockImplementation((p: string) => {
      if (p.includes('flow.json') || p.includes('theme.json') || p.includes('step1.json')) return true;
      return false;
    });

    (fs.readJson as any).mockImplementation((p: string) => {
      if (p.includes('flow.json')) return mockFlow;
      if (p.includes('theme.json')) return mockTheme;
      if (p.includes('step1.json')) return mockStep;
      if (p.includes('state.json')) return mockState;
      return {};
    });

    (glob as any).mockResolvedValue(['test-campaign/steps/step1.json']);

    const config = await parser.loadCampaignBase(campaignId);

    expect(config.campaignId).toBe(campaignId);
    expect(config.flow).toEqual(mockFlow);
    expect(config.theme).toEqual(mockTheme);
    expect(config.steps.step1).toEqual(mockStep);
    expect(config.state).toEqual(mockState);
  });

  it('should interpolate variables during loadCampaignBase', async () => {
    const campaignId = 'test-campaign';
    const mockState = { primaryColor: 'blue', firstStep: 'welcome' };
    const mockFlow = { initialStep: '{{firstStep}}' };
    const mockTheme = { colors: { primary: '{{primaryColor}}' } };
    const mockStep = { sections: [{ component: 'Hero', props: { bg: '{{primaryColor}}' } }] };

    (fs.pathExists as any).mockImplementation(() => true);

    (fs.readJson as any).mockImplementation((p: string) => {
      if (p.includes('state.json')) return mockState;
      if (p.includes('flow.json')) return mockFlow;
      if (p.includes('theme.json')) return mockTheme;
      if (p.includes('step1.json')) return mockStep;
      return {};
    });

    (glob as any).mockResolvedValue(['test-campaign/steps/step1.json']);

    const config = await parser.loadCampaignBase(campaignId);

    expect(config.flow.initialStep).toBe('welcome');
    expect(config.theme.colors.primary).toBe('blue');
    expect(config.steps.step1.sections[0].props!.bg).toBe('blue');
    expect(config.state).toEqual(mockState);
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

  it('should interpolate variables during loadOverrides', async () => {
    const campaignId = 'test-campaign';
    const mockStateOverride = { overrideColor: 'purple' };
    const mockThemeOverride = { colors: { primary: '{{overrideColor}}' } };

    (fs.pathExists as any).mockImplementation((p: string) => p.includes('v1/theme.json') || p.includes('v1/state.json'));
    (fs.readJson as any).mockImplementation((p: string) => {
      if (p.includes('v1/theme.json')) return mockThemeOverride;
      if (p.includes('v1/state.json')) return mockStateOverride;
      return null;
    });
    (glob as any).mockResolvedValue([]);

    const overrides = await parser.loadOverrides(campaignId, 'v1');
    expect(overrides.theme).toEqual({ colors: { primary: 'purple' } });
    expect(overrides.state).toEqual(mockStateOverride);
  });
});
