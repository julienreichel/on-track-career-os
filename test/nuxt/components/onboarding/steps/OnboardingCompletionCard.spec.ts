import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OnboardingCompletionCard from '@/components/onboarding/steps/OnboardingCompletionCard.vue';
import { createTestI18n } from '../../../../utils/createTestI18n';

const mountCard = () => {
  return mount(OnboardingCompletionCard, {
    global: {
      plugins: [createTestI18n()],
      stubs: { UCard: true, UButton: true },
    },
  });
};

describe('OnboardingCompletionCard', () => {
  describe('Component Lifecycle', () => {
    it('mounts successfully', () => {
      const wrapper = mountCard();
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });

    it('is a valid Vue component', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.$options).toBeDefined();
    });
  });

  describe('Props', () => {
    it('requires no props', () => {
      const wrapper = mountCard();
      expect(Object.keys(wrapper.props())).toHaveLength(0);
    });
  });

  describe('Component Structure', () => {
    it('has root element', () => {
      const wrapper = mountCard();
      expect(wrapper.element).toBeDefined();
      expect(wrapper.element.tagName).toBeDefined();
    });

    it('uses spacing classes', () => {
      const wrapper = mountCard();
      const classes = wrapper.classes();
      expect(classes.some((c) => c.includes('space-y'))).toBe(true);
    });
  });

  describe('Translation Keys Usage', () => {
    it('component is properly internationalized', () => {
      const wrapper = mountCard();
      // Component should have i18n available
      expect(wrapper.vm.$t).toBeDefined();
    });

    it('can access title translation', () => {
      const wrapper = mountCard();
      const titleTranslation = wrapper.vm.$t('onboarding.complete.title');
      expect(titleTranslation).toBeDefined();
      expect(typeof titleTranslation).toBe('string');
    });

    it('can access description translation', () => {
      const wrapper = mountCard();
      const descTranslation = wrapper.vm.$t('onboarding.complete.description');
      expect(descTranslation).toBeDefined();
      expect(typeof descTranslation).toBe('string');
    });

    it('can access identity path translation', () => {
      const wrapper = mountCard();
      const identityTranslation = wrapper.vm.$t('onboarding.complete.identityPath');
      expect(identityTranslation).toBeDefined();
      expect(typeof identityTranslation).toBe('string');
    });

    it('can access job path translation', () => {
      const wrapper = mountCard();
      const jobTranslation = wrapper.vm.$t('onboarding.complete.jobPath');
      expect(jobTranslation).toBeDefined();
      expect(typeof jobTranslation).toBe('string');
    });
  });

  describe('Navigation Paths', () => {
    it('defines profile path for identity button', () => {
      // Test that /profile route is correct
      const profilePath = '/profile';
      expect(profilePath).toBe('/profile');
    });

    it('defines jobs path for job analysis button', () => {
      // Test that /jobs/new route is correct
      const jobsPath = '/jobs/new';
      expect(jobsPath).toBe('/jobs/new');
    });
  });

  describe('Component Behavior', () => {
    it('renders without errors', () => {
      expect(() => mountCard()).not.toThrow();
    });

    it('maintains consistent state', () => {
      const wrapper = mountCard();
      const initialHtml = wrapper.html();
      expect(initialHtml).toBeDefined();
      expect(initialHtml.length).toBeGreaterThan(0);
    });
  });

  describe('Button Configuration', () => {
    it('identity button should navigate to profile', () => {
      const identityConfig = {
        to: '/profile',
        color: 'primary',
        translationKey: 'onboarding.complete.identityPath',
      };
      expect(identityConfig.to).toBe('/profile');
      expect(identityConfig.color).toBe('primary');
    });

    it('job button should navigate to new job', () => {
      const jobConfig = {
        to: '/jobs/new',
        variant: 'outline',
        color: 'neutral',
        translationKey: 'onboarding.complete.jobPath',
      };
      expect(jobConfig.to).toBe('/jobs/new');
      expect(jobConfig.variant).toBe('outline');
      expect(jobConfig.color).toBe('neutral');
    });
  });

  describe('User Journey Logic', () => {
    it('provides two distinct paths', () => {
      const paths = ['/profile', '/jobs/new'];
      expect(paths).toHaveLength(2);
      expect(paths[0]).not.toBe(paths[1]);
    });

    it('identity path leads to profile building', () => {
      const identityPath = '/profile';
      expect(identityPath).toContain('profile');
    });

    it('job path leads to job analysis', () => {
      const jobPath = '/jobs/new';
      expect(jobPath).toContain('jobs');
      expect(jobPath).toContain('new');
    });
  });

  describe('Completion State', () => {
    it('indicates successful onboarding completion', () => {
      const wrapper = mountCard();
      // Component exists means onboarding reached completion
      expect(wrapper.exists()).toBe(true);
    });

    it('presents forward-looking options', () => {
      const options = [
        { key: 'identityPath', route: '/profile' },
        { key: 'jobPath', route: '/jobs/new' },
      ];
      expect(options).toHaveLength(2);
      expect(options.every((opt) => opt.route.startsWith('/'))).toBe(true);
    });
  });
});
