import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import ProfileCoreIdentitySection from '@/components/profile/sections/ProfileCoreIdentitySection.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import type { ProfileForm } from '@/components/profile/types';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      profile: {
        sections: {
          coreIdentity: 'Core Identity',
        },
        fields: {
          fullName: 'Full name',
          headline: 'Headline',
          location: 'Location',
          seniorityLevel: 'Seniority',
        },
        photo: {
          empty: 'Add photo',
          help: 'Helper',
          upload: 'Upload',
          remove: 'Remove',
        },
      },
    },
  },
});

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UAvatar: {
    template: '<div class="u-avatar"><slot /></div>',
    props: ['src', 'alt'],
  },
  UButton: {
    template: '<button class="u-button" @click="$emit(\'click\')"><slot /></button>',
  },
  UFormField: {
    template:
      '<label class="u-form-field">{{ label }}<slot /></label>',
    props: ['label', 'required'],
  },
  UInput: {
    template:
      '<input class="u-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'required'],
  },
};

const createWrapper = (isEditing = false) => {
  const form = ref<ProfileForm>({
    fullName: 'Ada Lovelace',
    headline: 'Mathematician',
    location: 'London',
    seniorityLevel: 'Principal',
    primaryEmail: '',
    primaryPhone: '',
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

  const wrapper = mount(ProfileCoreIdentitySection, {
    global: {
      plugins: [i18n],
      stubs,
      provide: {
        [profileFormContextKey as symbol]: {
          form,
          isEditing: ref(isEditing),
          hasCoreIdentity: ref(true),
          hasWorkPermit: ref(false),
          hasContactInfo: ref(false),
          hasSocialLinks: ref(false),
          hasCareerDirection: ref(false),
          hasIdentityValues: ref(false),
          hasProfessionalAttributes: ref(false),
          photoPreviewUrl: ref(null),
          uploadingPhoto: ref(false),
          photoError: ref<string | null>(null),
          photoInputRef: ref<HTMLInputElement | null>(null),
          emailError: ref<string | undefined>(undefined),
          phoneError: ref<string | undefined>(undefined),
          triggerPhotoPicker: () => {},
          handlePhotoSelected: () => {},
          handleRemovePhoto: () => {},
          formatSocialLink: (link: string) => link,
        },
      },
    },
  });

  return wrapper;
};

describe('ProfileCoreIdentitySection', () => {
  it('renders view mode with identity fields', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Core Identity');
    expect(wrapper.text()).toContain('Ada Lovelace');
    expect(wrapper.text()).toContain('Mathematician');
    expect(wrapper.text()).toContain('London');
  });

  it('renders edit mode with inputs', () => {
    const wrapper = createWrapper(true);
    expect(wrapper.findAll('.u-input')).toHaveLength(4);
  });
});
