import { config } from '@vue/test-utils';

const routerLinkStub = {
  name: 'RouterLinkStub',
  props: ['to'],
  template: `<a :href="typeof to === 'string' ? to : to?.path || '#'"><slot /></a>`,
};

config.global.stubs = {
  ...config.global.stubs,
  RouterLink: routerLinkStub,
  NuxtLink: routerLinkStub,
  ProgressGuidanceSection: {
    name: 'ProgressGuidanceSection',
    template: '<div class="progress-guidance-stub" />',
  },
  GuidanceBanner: {
    name: 'GuidanceBanner',
    template: '<div class="guidance-banner-stub" />',
  },
  EmptyStateActionCard: {
    name: 'EmptyStateActionCard',
    template: '<div class="guidance-empty-state-stub" />',
  },
  LockedFeatureCard: {
    name: 'LockedFeatureCard',
    template: '<div class="guidance-locked-stub" />',
  },
};
