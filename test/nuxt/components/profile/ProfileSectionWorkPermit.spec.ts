import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { ref, computed } from 'vue';
import ProfileSectionWorkPermit from '@/components/profile/section/WorkPermit.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import type { ProfileForm } from '@/components/profile/types';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /><slot name="footer" /></div>',
  },
  UFormField: {
    template: '<div class="u-form-field"><slot /></div>',
  },
  UInput: {
    template:
      '<input class="u-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder'],
  },
  UButton: {
    template: '<button class="u-button" type="button"><slot /></button>',
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
          editingSection: ref(null),
          sectionEditingEnabled: computed(() => true),
          loading: ref(false),
          hasValidationErrors: computed(() => false),
          hasWorkPermit: ref(true),
          startSectionEditing: () => {},
          cancelSectionEditing: () => {},
          saveSectionEditing: async () => {},
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

  it('renders input in edit mode', () => {
    const wrapper = mountSection(true);
    expect(wrapper.find('.u-input').exists()).toBe(true);
  });

  it('shows empty message when no info', () => {
    const wrapper = mountSection(false, '');
    expect(wrapper.text()).toContain('Work permit information not provided');
  });
});
