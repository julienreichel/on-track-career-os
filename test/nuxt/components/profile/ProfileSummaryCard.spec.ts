import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import ProfileSummaryCard from '@/components/profile/SummaryCard.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot /></div>',
  },
  UAvatar: {
    template: '<div class="u-avatar"><slot /></div>',
    props: ['src', 'alt'],
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
    props: ['color', 'variant'],
  },
  UIcon: {
    template: '<span class="u-icon"></span>',
    props: ['name'],
  },
};

describe('ProfileSummaryCard', () => {
  it('renders name, headline, and location', () => {
    const wrapper = mount(ProfileSummaryCard, {
      props: {
        profile: {
          fullName: 'Ada Lovelace',
          headline: 'Mathematician',
          location: 'London',
          aspirations: [],
        },
        photoUrl: null,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Ada Lovelace');
    expect(wrapper.text()).toContain('Mathematician');
    expect(wrapper.text()).toContain('London');
  });

  it('falls back to placeholders when data missing', () => {
    const wrapper = mount(ProfileSummaryCard, {
      props: {
        profile: null,
        photoUrl: null,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('profile.summary.emptyName'));
    expect(wrapper.text()).toContain(i18n.global.t('profile.summary.emptyHeadline'));
  });

  it('shows up to three career direction items', () => {
    const wrapper = mount(ProfileSummaryCard, {
      props: {
        profile: {
          fullName: 'Ada Lovelace',
          headline: 'Mathematician',
          aspirations: ['Aspiration A', 'Aspiration B', 'Aspiration C'],
        },
        photoUrl: null,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Aspiration A');
    expect(wrapper.text()).toContain('Aspiration C');
  });
});
