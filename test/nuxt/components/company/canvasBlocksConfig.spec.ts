import { describe, it, expect } from 'vitest';
import { COMPANY_CANVAS_UI_BLOCKS } from '@/components/company/canvasBlocksConfig';
import { COMPANY_CANVAS_BLOCKS } from '@/domain/company-canvas/canvasBlocks';

describe('canvasBlocksConfig', () => {
  it('should export an array of canvas block configurations', () => {
    expect(Array.isArray(COMPANY_CANVAS_UI_BLOCKS)).toBe(true);
    expect(COMPANY_CANVAS_UI_BLOCKS.length).toBeGreaterThan(0);
  });

  it('should have correct structure for each config item', () => {
    COMPANY_CANVAS_UI_BLOCKS.forEach((config) => {
      expect(config).toHaveProperty('key');
      expect(config).toHaveProperty('labelKey');
      expect(config).toHaveProperty('hintKey');
      expect(typeof config.key).toBe('string');
      expect(typeof config.labelKey).toBe('string');
      expect(typeof config.hintKey).toBe('string');
    });
  });

  it('should map all COMPANY_CANVAS_BLOCKS keys', () => {
    const configKeys = COMPANY_CANVAS_UI_BLOCKS.map((c) => c.key);

    COMPANY_CANVAS_BLOCKS.forEach((key) => {
      expect(configKeys).toContain(key);
    });
  });

  it('should have i18n key patterns for labels', () => {
    COMPANY_CANVAS_UI_BLOCKS.forEach((config) => {
      // Labels should follow pattern: companies.canvas.blocks.{key}.label
      expect(config.labelKey).toMatch(/^companies\.canvas\.blocks\.\w+\.label$/);
    });
  });

  it('should have i18n key patterns for hints', () => {
    COMPANY_CANVAS_UI_BLOCKS.forEach((config) => {
      // Hints should follow pattern: companies.canvas.blocks.{key}.hint
      expect(config.hintKey).toMatch(/^companies\.canvas\.blocks\.\w+\.hint$/);
    });
  });

  it('should have matching label and hint key bases', () => {
    COMPANY_CANVAS_UI_BLOCKS.forEach((config) => {
      // Extract base from labelKey: companies.canvas.blocks.{key}.label
      const labelBase = config.labelKey.replace('.label', '');
      // Extract base from hintKey: companies.canvas.blocks.{key}.hint
      const hintBase = config.hintKey.replace('.hint', '');

      expect(labelBase).toBe(hintBase);
    });
  });

  it('should contain known canvas block keys', () => {
    const configKeys = COMPANY_CANVAS_UI_BLOCKS.map((c) => c.key);

    // Known keys from COMPANY_CANVAS_BLOCKS (Business Model Canvas)
    expect(configKeys).toContain('customerSegments');
    expect(configKeys).toContain('valuePropositions');
    expect(configKeys).toContain('channels');
  });

  it('should have unique keys', () => {
    const keys = COMPANY_CANVAS_UI_BLOCKS.map((c) => c.key);
    const uniqueKeys = new Set(keys);

    expect(keys.length).toBe(uniqueKeys.size);
  });

  it('should have keys matching domain constant', () => {
    const configKeys = new Set(COMPANY_CANVAS_UI_BLOCKS.map((c) => c.key));

    expect(configKeys.size).toBe(COMPANY_CANVAS_BLOCKS.length);
  });

  it('should not have empty keys or i18n paths', () => {
    COMPANY_CANVAS_UI_BLOCKS.forEach((config) => {
      expect(config.key.trim()).not.toBe('');
      expect(config.labelKey.trim()).not.toBe('');
      expect(config.hintKey.trim()).not.toBe('');
    });
  });
});
