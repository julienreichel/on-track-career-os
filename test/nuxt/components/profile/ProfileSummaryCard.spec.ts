import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import ProfileSummaryCard from '@/components/profile/SummaryCard.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      profile: {
        fields: {
          fullName: 'Full Name',
        },
        summary: {
          emptyName: 'Complete your profile',
          emptyHeadline: 'Add headline',
          careerDirection: 'Career direction',
          careerDirectionEmpty: 'Add goals',
        },
      },
    },
  },
});

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
};

describe('ProfileSummaryCard', () => {
  it('renders name, headline, and location', () => {
    const wrapper = mount(ProfileSummaryCard, {
      props: {
        profile: {
          fullName: 'Ada Lovelace',
          headline: 'Mathematician',
          location: 'London',
          goals: [],
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

    expect(wrapper.text()).toContain('Complete your profile');
    expect(wrapper.text()).toContain('Add headline');
  });

  it('shows up to three career direction items', () => {
    const wrapper = mount(ProfileSummaryCard, {
      props: {
        profile: {
          fullName: 'Ada Lovelace',
          headline: 'Mathematician',
          goals: ['Goal A', 'Goal B'],
          aspirations: ['Aspiration C'],
        },
        photoUrl: null,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Goal A');
    expect(wrapper.text()).toContain('Aspiration C');
  });
});
