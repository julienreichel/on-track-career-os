import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { ref } from 'vue';
import ProfileSectionProfessionalAttributes from '@/components/profile/section/ProfessionalAttributes.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import type { ProfileForm } from '@/components/profile/types';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
  UIcon: {
    template: '<span class="u-icon"></span>',
    props: ['name'],
  },
  TagInput: {
    template: '<div class="tag-input">{{ modelValue?.join(", ") }}</div>',
    props: ['modelValue', 'label', 'testId', 'editable'],
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
    aspirations: [],
    personalValues: [],
    strengths: [],
    interests: [],
    skills: ['Leadership'],
    certifications: ['Scrum Master'],
    languages: ['English'],
    socialLinks: [],
  });

  return mount(ProfileSectionProfessionalAttributes, {
    global: {
      plugins: [i18n],
      stubs,
      provide: {
        [profileFormContextKey as symbol]: {
          form,
          isEditing: ref(isEditing),
          hasProfessionalAttributes: ref(true),
        },
      },
    },
  });
};

describe('ProfileSectionProfessionalAttributes', () => {
  it('renders skills, certifications, and languages', () => {
    const wrapper = mountSection(false);
    expect(wrapper.text()).toContain('Professional Attributes');
    expect(wrapper.text()).toContain('Leadership');
    expect(wrapper.text()).toContain('Scrum Master');
  });

  it('renders tag inputs in edit mode', () => {
    const wrapper = mountSection(true);
    expect(wrapper.findAll('.tag-input')).toHaveLength(3);
  });
});
