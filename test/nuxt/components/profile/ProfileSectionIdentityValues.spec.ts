import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { ref, computed } from 'vue';
import ProfileSectionIdentityValues from '@/components/profile/section/IdentityValues.vue';
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
          editingSection: ref(null),
          sectionEditingEnabled: computed(() => true),
          loading: ref(false),
          hasValidationErrors: computed(() => false),
          hasIdentityValues: ref(true),
          startSectionEditing: () => {},
          cancelSectionEditing: () => {},
          saveSectionEditing: async () => {},
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

  it('renders personal values tag input', () => {
    const wrapper = mountSection(false);
    expect(wrapper.text()).toContain('Curiosity');
  });

  it('renders strengths tag input', () => {
    const wrapper = mountSection(false);
    expect(wrapper.text()).toContain('Leadership');
  });

  it('renders interests tag input', () => {
    const wrapper = mountSection(false);
    expect(wrapper.text()).toContain('Mathematics');
  });

  it('has form data for all identity values', () => {
    const wrapper = mountSection(true);
    expect(wrapper.vm.form.personalValues).toBeDefined();
    expect(wrapper.vm.form.strengths).toBeDefined();
    expect(wrapper.vm.form.interests).toBeDefined();
  });

  it('hides section when no values and not editing', () => {
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
      skills: [],
      certifications: [],
      languages: [],
      socialLinks: [],
    });

    const wrapper = mount(ProfileSectionIdentityValues, {
      global: {
        plugins: [i18n],
        stubs,
        provide: {
          [profileFormContextKey as symbol]: {
            form,
            isEditing: ref(false),
            editingSection: ref(null),
            sectionEditingEnabled: computed(() => true),
            loading: ref(false),
            hasValidationErrors: computed(() => false),
            hasIdentityValues: ref(false),
            startSectionEditing: () => {},
            cancelSectionEditing: () => {},
            saveSectionEditing: async () => {},
          },
        },
      },
    });

    expect(wrapper.find('.u-card').exists()).toBe(false);
  });

  it('component renders in view mode', () => {
    const wrapper = mountSection(false);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm).toBeDefined();
  });

  it('passes correct editable prop to tag inputs in edit mode', () => {
    const wrapper = mountSection(true);
    const tagInputs = wrapper.findAllComponents({ name: 'TagInput' });
    tagInputs.forEach((input) => {
      expect(input.props('editable')).toBe(true);
    });
  });

  it('passes correct editable prop to tag inputs in view mode', () => {
    const wrapper = mountSection(false);
    const tagInputs = wrapper.findAllComponents({ name: 'TagInput' });
    tagInputs.forEach((input) => {
      expect(input.props('editable')).toBe(false);
    });
  });
});
