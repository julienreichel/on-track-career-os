import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import BadgeGridCard from '@/components/badges/BadgeGridCard.vue';
import type { BadgeDefinition } from '@/domain/badges';

const i18n = createTestI18n();

const stubs = {
  UCard: { template: '<div class="u-card"><slot /></div>' },
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  UIcon: { template: '<span class="u-icon"></span>' },
};

describe('BadgeGridCard', () => {
  it('renders empty state when no badges are earned', () => {
    const wrapper = mount(BadgeGridCard, {
      props: {
        badges: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('badges.empty'));
  });

  it('renders earned badges', () => {
    const badges: BadgeDefinition[] = [
      {
        id: 'grounded',
        titleKey: 'badges.catalog.grounded.title',
        descriptionKey: 'badges.catalog.grounded.description',
        icon: 'i-heroicons-globe-alt',
        phase: 'phase1',
      },
    ];

    const wrapper = mount(BadgeGridCard, {
      props: {
        badges,
        newlyEarnedIds: ['grounded'],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('badges.catalog.grounded.title'));
    expect(wrapper.text()).toContain(i18n.global.t('badges.new'));
  });
});
