import { describe, it, expect } from 'vitest';
import { isPersonalCanvas } from '@/domain/ai-operations/PersonalCanvas';
import type { PersonalCanvas } from '@/domain/ai-operations/PersonalCanvas';

describe('PersonalCanvas', () => {
  describe('isPersonalCanvas', () => {
    it('should return true for valid PersonalCanvas', () => {
      const validCanvas: PersonalCanvas = {
        customerSegments: ['Segment 1', 'Segment 2'],
        valueProposition: ['Value 1', 'Value 2'],
        channels: ['Channel 1'],
        customerRelationships: ['Relationship 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        keyPartners: ['Partner 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1'],
      };

      expect(isPersonalCanvas(validCanvas)).toBe(true);
    });

    it('should return true for PersonalCanvas with empty arrays', () => {
      const canvasWithEmptyArrays: PersonalCanvas = {
        customerSegments: [],
        valueProposition: [],
        channels: [],
        customerRelationships: [],
        keyActivities: [],
        keyResources: [],
        keyPartners: [],
        costStructure: [],
        revenueStreams: [],
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
        customerSegments: ['Segment 1'],
        valueProposition: 'not an array',
        channels: ['Channel 1'],
        customerRelationships: ['Relationship 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        keyPartners: ['Partner 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1'],
      };

      expect(isPersonalCanvas(invalidCanvas)).toBe(false);
    });

    it('should return false when array contains non-string items', () => {
      const invalidCanvas = {
        customerSegments: ['Segment 1'],
        valueProposition: ['Value 1', 123],
        channels: ['Channel 1'],
        customerRelationships: ['Relationship 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        keyPartners: ['Partner 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1'],
      };

      expect(isPersonalCanvas(invalidCanvas)).toBe(false);
    });

    it('should return false when array contains null', () => {
      const invalidCanvas = {
        customerSegments: ['Segment 1'],
        valueProposition: ['Value 1', null],
        channels: ['Channel 1'],
        customerRelationships: ['Relationship 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        keyPartners: ['Partner 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1'],
      };

      expect(isPersonalCanvas(invalidCanvas)).toBe(false);
    });

    it('should return false when array contains objects', () => {
      const invalidCanvas = {
        customerSegments: ['Segment 1'],
        valueProposition: ['Value 1', { nested: 'object' }],
        channels: ['Channel 1'],
        customerRelationships: ['Relationship 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        keyPartners: ['Partner 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1'],
      };

      expect(isPersonalCanvas(invalidCanvas)).toBe(false);
    });

    it('should validate all required fields', () => {
      const requiredFields = [
        'customerSegments',
        'valueProposition',
        'channels',
        'customerRelationships',
        'keyActivities',
        'keyResources',
        'keyPartners',
        'costStructure',
        'revenueStreams',
      ];

      requiredFields.forEach((field) => {
        const baseCanvas = {
          customerSegments: ['Segment'],
          valueProposition: ['Value'],
          channels: ['Channel'],
          customerRelationships: ['Relationship'],
          keyActivities: ['Activity'],
          keyResources: ['Resource'],
          keyPartners: ['Partner'],
          costStructure: ['Cost'],
          revenueStreams: ['Revenue'],
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
        customerSegments: ['Segment 1'],
        valueProposition: ['Value 1'],
        channels: ['Channel 1'],
        customerRelationships: ['Relationship 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        keyPartners: ['Partner 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1'],
        extraField: 'extra value',
      };

      expect(isPersonalCanvas(canvasWithExtra)).toBe(true);
    });
  });
});
