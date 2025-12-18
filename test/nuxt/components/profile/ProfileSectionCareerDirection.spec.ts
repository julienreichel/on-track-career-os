import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import ProfileSectionCareerDirection from '@/components/profile/section/CareerDirection.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import type { ProfileForm } from '@/components/profile/types';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en: {
      profile: {
        sections: {
          careerDirection: 'Career Direction',
        },
        fields: {
          goals: 'Goals',
          aspirations: 'Aspirations',
          goalsPlaceholder: 'Add goal',
          aspirationsPlaceholder: 'Add aspiration',
          goalsHint: 'Hint',
          aspirationsHint: 'Hint',
        },
      },
    },
  },
});

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
  TagInput: {
    template:
      '<div class="tag-input"><slot /></div>',
    props: ['modelValue', 'label'],
  },
};

const mountSection = (isEditing = false) => {
  const form = ref<ProfileForm>({
    fullName: 'Ada Lovelace',
    headline: '',
    location: '',
    seniorityLevel: '',
    primaryEmail: '',
    primaryPhone: '',
    workPermitInfo: '',
    profilePhotoKey: null,
    goals: ['Lead research', 'Mentor engineers'],
    aspirations: ['Advance AI safety'],
    personalValues: [],
    strengths: [],
    interests: [],
    skills: [],
    certifications: [],
    languages: [],
    socialLinks: [],
  });

  return mount(ProfileSectionCareerDirection, {
    global: {
      plugins: [i18n],
      stubs,
      provide: {
        [profileFormContextKey as symbol]: {
          form,
          isEditing: ref(isEditing),
          hasCareerDirection: ref(true),
        },
      },
    },
  });
};

describe('ProfileSectionCareerDirection', () => {
  it('renders goals and aspirations in view mode', () => {
    const wrapper = mountSection(false);
    expect(wrapper.text()).toContain('Career Direction');
    expect(wrapper.text()).toContain('Lead research');
    expect(wrapper.text()).toContain('Advance AI safety');
  });

  it('renders tag inputs in edit mode', () => {
    const wrapper = mountSection(true);
    expect(wrapper.findAll('.tag-input')).toHaveLength(2);
  });
});
