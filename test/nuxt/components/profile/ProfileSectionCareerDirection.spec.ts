import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { ref, computed } from 'vue';
import ProfileSectionCareerDirection from '@/components/profile/section/CareerDirection.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import type { ProfileForm } from '@/components/profile/types';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /><slot name="footer" /></div>',
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
  UButton: {
    template: '<button class="u-button" type="button"><slot /></button>',
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
          editingSection: ref(null),
          sectionEditingEnabled: computed(() => true),
          loading: ref(false),
          hasValidationErrors: computed(() => false),
          hasCareerDirection: ref(true),
          startSectionEditing: () => {},
          cancelSectionEditing: () => {},
          saveSectionEditing: async () => {},
        },
      },
    },
  });
};

describe('ProfileSectionCareerDirection', () => {
  it('renders aspirations in view mode', () => {
    const wrapper = mountSection(false);
    expect(wrapper.text()).toContain('Career Direction');
    expect(wrapper.text()).toContain('Advance AI safety');
  });

  it('renders tag inputs in edit mode', () => {
    const wrapper = mountSection(true);
    expect(wrapper.findAll('.tag-input')).toHaveLength(1);
  });
});
