import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import ProfileSectionWorkPermit from '@/components/profile/section/WorkPermit.vue';
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
          workPermit: 'Work Authorization',
        },
        fields: {
          workPermitInfo: 'Work Permit',
          workPermitPlaceholder: 'Add details',
          workPermitEmpty: 'Work permit information not provided',
        },
      },
    },
  },
});

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UFormField: {
    template: '<div class="u-form-field"><slot /></div>',
  },
  UTextarea: {
    template:
      '<textarea class="u-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'rows', 'placeholder'],
  },
};

const mountSection = (isEditing = false, info = 'Swiss Citizen') => {
  const form = ref<ProfileForm>({
    fullName: 'Ada Lovelace',
    headline: '',
    location: '',
    seniorityLevel: '',
    primaryEmail: '',
    primaryPhone: '',
    workPermitInfo: info,
    profilePhotoKey: null,
    goals: [],
    aspirations: [],
    personalValues: [],
    strengths: [],
    interests: [],
    skills: [],
    certifications: [],
    languages: [],
    socialLinks: [],
  });

  return mount(ProfileSectionWorkPermit, {
    global: {
      plugins: [i18n],
      stubs,
      provide: {
        [profileFormContextKey as symbol]: {
          form,
          isEditing: ref(isEditing),
          hasWorkPermit: ref(true),
        },
      },
    },
  });
};

describe('ProfileSectionWorkPermit', () => {
  it('renders work permit info in view mode', () => {
    const wrapper = mountSection(false, 'Swiss Citizen');
    expect(wrapper.text()).toContain('Swiss Citizen');
  });

  it('renders textarea in edit mode', () => {
    const wrapper = mountSection(true);
    expect(wrapper.find('.u-textarea').exists()).toBe(true);
  });

  it('shows empty message when no info', () => {
    const wrapper = mountSection(false, '');
    expect(wrapper.text()).toContain('Work permit information not provided');
  });
});
