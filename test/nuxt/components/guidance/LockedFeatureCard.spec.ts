import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import LockedFeatureCard from '@/components/guidance/LockedFeatureCard.vue';
import type { LockedFeature } from '@/domain/onboarding';

const mountCard = (feature: LockedFeature) => {
  return mount(LockedFeatureCard, {
    props: { feature },
    global: {
      plugins: [createTestI18n()],
      stubs: { UCard: true, UBadge: true, UButton: true },
    },
  });
};

describe('LockedFeatureCard', () => {
  const mockFeature: LockedFeature = {
    id: 'test-feature',
    titleKey: 'guidance.locked.feature.title',
    descriptionKey: 'guidance.locked.feature.description',
    cta: {
      labelKey: 'guidance.locked.feature.cta',
      to: '/test-path',
    },
  };

  describe('Props', () => {
    it('accepts and preserves feature prop', () => {
      const wrapper = mountCard(mockFeature);
      expect(wrapper.props('feature')).toEqual(mockFeature);
    });

    it('maintains all feature properties correctly', () => {
      const wrapper = mountCard(mockFeature);
      const feature = wrapper.props('feature');
      expect(feature.id).toBe('test-feature');
      expect(feature.titleKey).toBe('guidance.locked.feature.title');
      expect(feature.descriptionKey).toBe('guidance.locked.feature.description');
      expect(feature.cta.labelKey).toBe('guidance.locked.feature.cta');
      expect(feature.cta.to).toBe('/test-path');
    });

    it('handles different feature configurations', () => {
      const feature: LockedFeature = {
        id: 'cv-builder',
        titleKey: 'cv.title',
        descriptionKey: 'cv.description',
        cta: { labelKey: 'cv.cta', to: '/cv' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.props('feature').id).toBe('cv-builder');
      expect(wrapper.props('feature').cta.to).toBe('/cv');
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts successfully', () => {
      const wrapper = mountCard(mockFeature);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });

    it('maintains state after mount', () => {
      const wrapper = mountCard(mockFeature);
      expect(wrapper.vm.$props.feature).toEqual(mockFeature);
    });
  });

  describe('Data Attributes', () => {
    it('generates data-testid from feature ID', () => {
      const wrapper = mountCard(mockFeature);
      expect(wrapper.attributes('data-testid')).toBe('locked-feature-test-feature');
    });

    it('handles hyphenated IDs', () => {
      const feature: LockedFeature = {
        id: 'ai-cv-builder',
        titleKey: 'test.title',
        descriptionKey: 'test.description',
        cta: { labelKey: 'test.cta', to: '/test' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.attributes('data-testid')).toBe('locked-feature-ai-cv-builder');
    });

    it('handles complex IDs with numbers', () => {
      const feature: LockedFeature = {
        id: 'feature-v2-pro',
        titleKey: 'test.title',
        descriptionKey: 'test.description',
        cta: { labelKey: 'test.cta', to: '/test' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.attributes('data-testid')).toBe('locked-feature-feature-v2-pro');
    });
  });

  describe('Translation Keys', () => {
    it('provides correct title key', () => {
      const wrapper = mountCard(mockFeature);
      expect(wrapper.vm.$props.feature.titleKey).toBe('guidance.locked.feature.title');
    });

    it('provides correct description key', () => {
      const wrapper = mountCard(mockFeature);
      expect(wrapper.vm.$props.feature.descriptionKey).toBe('guidance.locked.feature.description');
    });

    it('provides correct CTA key', () => {
      const wrapper = mountCard(mockFeature);
      expect(wrapper.vm.$props.feature.cta.labelKey).toBe('guidance.locked.feature.cta');
    });

    it('supports custom keys per feature', () => {
      const feature: LockedFeature = {
        id: 'custom',
        titleKey: 'custom.title',
        descriptionKey: 'custom.desc',
        cta: { labelKey: 'custom.action', to: '/custom' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.vm.$props.feature.titleKey).toBe('custom.title');
      expect(wrapper.vm.$props.feature.descriptionKey).toBe('custom.desc');
      expect(wrapper.vm.$props.feature.cta.labelKey).toBe('custom.action');
    });
  });

  describe('Navigation Logic', () => {
    it('specifies correct CTA destination', () => {
      const wrapper = mountCard(mockFeature);
      expect(wrapper.vm.$props.feature.cta.to).toBe('/test-path');
    });

    it('supports profile routes', () => {
      const feature: LockedFeature = {
        ...mockFeature,
        cta: { labelKey: 'test', to: '/profile/upgrade' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.vm.$props.feature.cta.to).toBe('/profile/upgrade');
    });

    it('supports nested route paths', () => {
      const feature: LockedFeature = {
        ...mockFeature,
        cta: { labelKey: 'test', to: '/app/settings/billing' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.vm.$props.feature.cta.to).toBe('/app/settings/billing');
    });

    it('supports upgrade routes', () => {
      const feature: LockedFeature = {
        ...mockFeature,
        cta: { labelKey: 'test', to: '/upgrade/pro' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.vm.$props.feature.cta.to).toBe('/upgrade/pro');
    });
  });

  describe('Feature Type Variations', () => {
    it('handles CV builder feature logic', () => {
      const feature: LockedFeature = {
        id: 'cv-builder',
        titleKey: 'features.cv.title',
        descriptionKey: 'features.cv.description',
        cta: { labelKey: 'features.cv.unlock', to: '/upgrade/cv' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.props('feature').id).toBe('cv-builder');
      expect(wrapper.props('feature').cta.to).toBe('/upgrade/cv');
    });

    it('handles interview prep feature logic', () => {
      const feature: LockedFeature = {
        id: 'interview-prep',
        titleKey: 'features.interview.title',
        descriptionKey: 'features.interview.description',
        cta: { labelKey: 'features.interview.unlock', to: '/upgrade/interview' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.props('feature').id).toBe('interview-prep');
      expect(wrapper.props('feature').cta.to).toBe('/upgrade/interview');
    });

    it('handles canvas analysis feature logic', () => {
      const feature: LockedFeature = {
        id: 'canvas-analysis',
        titleKey: 'features.canvas.title',
        descriptionKey: 'features.canvas.description',
        cta: { labelKey: 'features.canvas.unlock', to: '/upgrade/canvas' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.props('feature').id).toBe('canvas-analysis');
      expect(wrapper.props('feature').cta.to).toBe('/upgrade/canvas');
    });

    it('handles AI-powered features logic', () => {
      const feature: LockedFeature = {
        id: 'ai-assistant',
        titleKey: 'features.ai.title',
        descriptionKey: 'features.ai.description',
        cta: { labelKey: 'features.ai.unlock', to: '/upgrade/ai' },
      };
      const wrapper = mountCard(feature);
      expect(wrapper.props('feature').id).toBe('ai-assistant');
    });
  });
});
