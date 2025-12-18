import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import ProfileSectionIdentityValues from '@/components/profile/section/IdentityValues.vue';
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
          identityValues: 'Identity & Values',
        },
        fields: {
          personalValues: 'Values',
          strengths: 'Strengths',
          interests: 'Interests',
          personalValuesPlaceholder: 'Add value',
          strengthsPlaceholder: 'Add strength',
          interestsPlaceholder: 'Add interest',
          personalValuesHint: 'Hint',
          strengthsHint: 'Hint',
          interestsHint: 'Hint',
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
    template: '<div class="tag-input"><slot /></div>',
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
    goals: [],
    aspirations: [],
    personalValues: ['Curiosity'],
    strengths: ['Leadership'],
    interests: ['Mathematics'],
    skills: [],
    certifications: [],
    languages: [],
    socialLinks: [],
  });

  return mount(ProfileSectionIdentityValues, {
    global: {
      plugins: [i18n],
      stubs,
      provide: {
        [profileFormContextKey as symbol]: {
          form,
          isEditing: ref(isEditing),
          hasIdentityValues: ref(true),
        },
      },
    },
  });
};

describe('ProfileSectionIdentityValues', () => {
  it('renders values in view mode', () => {
    const wrapper = mountSection(false);
    expect(wrapper.text()).toContain('Identity & Values');
    expect(wrapper.text()).toContain('Curiosity');
    expect(wrapper.text()).toContain('Mathematics');
  });

  it('renders tag inputs in edit mode', () => {
    const wrapper = mountSection(true);
    expect(wrapper.findAll('.tag-input')).toHaveLength(3);
  });
});
