import { describe, it, expect } from 'vitest';
import { isPersonalCanvas } from '@/domain/ai-operations/PersonalCanvas';
import type { PersonalCanvas } from '@/domain/ai-operations/PersonalCanvas';

describe('PersonalCanvas', () => {
  describe('isPersonalCanvas', () => {
    it('should return true for valid PersonalCanvas', () => {
      const validCanvas: PersonalCanvas = {
        valueProposition: ['Value 1', 'Value 2'],
        keyActivities: ['Activity 1'],
        strengthsAdvantage: ['Strength 1'],
        targetRoles: ['Role 1', 'Role 2'],
        channels: ['Channel 1'],
        resources: ['Resource 1'],
        careerDirection: ['Direction 1'],
        painRelievers: ['Pain reliever 1'],
        gainCreators: ['Gain creator 1'],
      };

      expect(isPersonalCanvas(validCanvas)).toBe(true);
    });

    it('should return true for PersonalCanvas with empty arrays', () => {
      const canvasWithEmptyArrays: PersonalCanvas = {
        valueProposition: [],
        keyActivities: [],
        strengthsAdvantage: [],
        targetRoles: [],
        channels: [],
        resources: [],
        careerDirection: [],
        painRelievers: [],
        gainCreators: [],
      };

      expect(isPersonalCanvas(canvasWithEmptyArrays)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isPersonalCanvas(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPersonalCanvas(undefined)).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isPersonalCanvas('string')).toBe(false);
      expect(isPersonalCanvas(123)).toBe(false);
      expect(isPersonalCanvas(true)).toBe(false);
      expect(isPersonalCanvas([])).toBe(false);
    });

    it('should return false when missing required fields', () => {
      const missingFields = {
        valueProposition: ['Value 1'],
        keyActivities: ['Activity 1'],
        // missing other required fields
      };

      expect(isPersonalCanvas(missingFields)).toBe(false);
    });

    it('should return false when field is not an array', () => {
      const invalidCanvas = {
        valueProposition: 'not an array',
        keyActivities: ['Activity 1'],
        strengthsAdvantage: ['Strength 1'],
        targetRoles: ['Role 1'],
        channels: ['Channel 1'],
        resources: ['Resource 1'],
        careerDirection: ['Direction 1'],
        painRelievers: ['Pain reliever 1'],
        gainCreators: ['Gain creator 1'],
      };

      expect(isPersonalCanvas(invalidCanvas)).toBe(false);
    });

    it('should return false when array contains non-string items', () => {
      const invalidCanvas = {
        valueProposition: ['Value 1', 123],
        keyActivities: ['Activity 1'],
        strengthsAdvantage: ['Strength 1'],
        targetRoles: ['Role 1'],
        channels: ['Channel 1'],
        resources: ['Resource 1'],
        careerDirection: ['Direction 1'],
        painRelievers: ['Pain reliever 1'],
        gainCreators: ['Gain creator 1'],
      };

      expect(isPersonalCanvas(invalidCanvas)).toBe(false);
    });

    it('should return false when array contains null', () => {
      const invalidCanvas = {
        valueProposition: ['Value 1', null],
        keyActivities: ['Activity 1'],
        strengthsAdvantage: ['Strength 1'],
        targetRoles: ['Role 1'],
        channels: ['Channel 1'],
        resources: ['Resource 1'],
        careerDirection: ['Direction 1'],
        painRelievers: ['Pain reliever 1'],
        gainCreators: ['Gain creator 1'],
      };

      expect(isPersonalCanvas(invalidCanvas)).toBe(false);
    });

    it('should return false when array contains objects', () => {
      const invalidCanvas = {
        valueProposition: ['Value 1', { nested: 'object' }],
        keyActivities: ['Activity 1'],
        strengthsAdvantage: ['Strength 1'],
        targetRoles: ['Role 1'],
        channels: ['Channel 1'],
        resources: ['Resource 1'],
        careerDirection: ['Direction 1'],
        painRelievers: ['Pain reliever 1'],
        gainCreators: ['Gain creator 1'],
      };

      expect(isPersonalCanvas(invalidCanvas)).toBe(false);
    });

    it('should validate all required fields', () => {
      const requiredFields = [
        'valueProposition',
        'keyActivities',
        'strengthsAdvantage',
        'targetRoles',
        'channels',
        'resources',
        'careerDirection',
        'painRelievers',
        'gainCreators',
      ];

      requiredFields.forEach((field) => {
        const baseCanvas = {
          valueProposition: ['Value'],
          keyActivities: ['Activity'],
          strengthsAdvantage: ['Strength'],
          targetRoles: ['Role'],
          channels: ['Channel'],
          resources: ['Resource'],
          careerDirection: ['Direction'],
          painRelievers: ['Pain reliever'],
          gainCreators: ['Gain creator'],
        };

        // Create canvas without one required field
        const canvas = { ...baseCanvas };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete canvas[field as keyof typeof canvas];

        expect(isPersonalCanvas(canvas)).toBe(false);
      });
    });

    it('should allow extra fields beyond required ones', () => {
      const canvasWithExtra = {
        valueProposition: ['Value 1'],
        keyActivities: ['Activity 1'],
        strengthsAdvantage: ['Strength 1'],
        targetRoles: ['Role 1'],
        channels: ['Channel 1'],
        resources: ['Resource 1'],
        careerDirection: ['Direction 1'],
        painRelievers: ['Pain reliever 1'],
        gainCreators: ['Gain creator 1'],
        extraField: 'extra value',
      };

      expect(isPersonalCanvas(canvasWithExtra)).toBe(true);
    });
  });
});
