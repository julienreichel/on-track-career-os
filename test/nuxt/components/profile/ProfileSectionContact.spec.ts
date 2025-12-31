import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { ref } from 'vue';
import ProfileSectionContact from '@/components/profile/section/Contact.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import type { ProfileForm } from '@/components/profile/types';

const i18n = createTestI18n();

const uiStubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UFormField: {
    template: '<label class="u-form-field">{{ label }}<slot /></label>',
    props: ['label', 'error'],
  },
  UInput: {
    template:
      '<input class="u-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'type', 'placeholder'],
  },
};

const mountSection = (isEditing = false) => {
  const form = ref<ProfileForm>({
    fullName: 'Ada Lovelace',
    headline: '',
    location: '',
    seniorityLevel: '',
    primaryEmail: 'ada@example.com',
    primaryPhone: '+41123456789',
    workPermitInfo: '',
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

  return mount(ProfileSectionContact, {
    global: {
      plugins: [i18n],
      stubs: uiStubs,
      provide: {
        [profileFormContextKey as symbol]: {
          form,
          isEditing: ref(isEditing),
          hasContactInfo: ref(true),
          emailError: ref<string | undefined>(undefined),
          phoneError: ref<string | undefined>(undefined),
        },
      },
    },
  });
};

describe('ProfileSectionContact', () => {
  it('renders email and phone in view mode', () => {
    const wrapper = mountSection(false);
    expect(wrapper.text()).toContain('Primary Email');
    expect(wrapper.text()).toContain('ada@example.com');
    expect(wrapper.text()).toContain('+41123456789');
  });

  it('renders inputs in edit mode', () => {
    const wrapper = mountSection(true);
    expect(wrapper.findAll('.u-input')).toHaveLength(2);
  });
});
