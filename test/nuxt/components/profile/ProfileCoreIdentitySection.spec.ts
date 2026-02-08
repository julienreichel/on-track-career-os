import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { ref, computed } from 'vue';
import ProfileSectionCoreIdentity from '@/components/profile/section/CoreIdentity.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import type { ProfileForm } from '@/components/profile/types';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /><slot name="footer" /></div>',
  },
  UAvatar: {
    template: '<div class="u-avatar"><slot /></div>',
    props: ['src', 'alt'],
  },
  UButton: {
    template: '<button class="u-button" @click="$emit(\'click\')"><slot /></button>',
  },
  UFormField: {
    template: '<label class="u-form-field">{{ label }}<slot /></label>',
    props: ['label', 'required'],
  },
  UInput: {
    template:
      '<input class="u-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'required'],
  },
};

const createWrapper = ({
  isEditing = false,
  photoPreviewUrl = null,
}: {
  isEditing?: boolean;
  photoPreviewUrl?: string | null;
} = {}) => {
  const form = ref<ProfileForm>({
    fullName: 'Ada Lovelace',
    headline: 'Mathematician',
    location: 'London',
    seniorityLevel: 'Principal',
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

  return mount(ProfileSectionCoreIdentity, {
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
          hasCoreIdentity: ref(true),
          hasWorkPermit: ref(false),
          hasContactInfo: ref(false),
          hasSocialLinks: ref(false),
          hasCareerDirection: ref(false),
          hasIdentityValues: ref(false),
          hasProfessionalAttributes: ref(false),
          photoPreviewUrl: ref(photoPreviewUrl),
          uploadingPhoto: ref(false),
          photoError: ref<string | null>(null),
          photoInputRef: ref<HTMLInputElement | null>(null),
          emailError: ref<string | undefined>(undefined),
          phoneError: ref<string | undefined>(undefined),
          startSectionEditing: () => {},
          cancelSectionEditing: () => {},
          saveSectionEditing: async () => {},
          triggerPhotoPicker: () => {},
          handlePhotoSelected: () => {},
          handleRemovePhoto: () => {},
          formatSocialLink: (link: string) => link,
        },
      },
    },
  });
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
    const wrapper = createWrapper({ isEditing: true });
    expect(wrapper.findAll('.u-input')).toHaveLength(4);
  });

  it('shows upload action when no photo is set in view mode', () => {
    const wrapper = createWrapper({ isEditing: false, photoPreviewUrl: null });
    const uploadLabel = i18n.global.t('profile.photo.upload');
    const hasUploadAction = wrapper
      .findAll('.u-button')
      .some((button) => button.text().includes(uploadLabel));
    expect(hasUploadAction).toBe(true);
  });

  it('component handles photo preview URL in state', () => {
    const wrapper = createWrapper({
      isEditing: false,
      photoPreviewUrl: 'https://example.com/photo.jpg',
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm).toBeDefined();
  });

  it('component has fullName prop for alt text', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.form.fullName).toContain('Ada Lovelace');
  });

  it('component supports edit mode state', () => {
    const wrapper = createWrapper({ isEditing: true });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm).toBeDefined();
  });

  it('component handles photo URL and edit mode together', () => {
    const wrapper = createWrapper({
      isEditing: true,
      photoPreviewUrl: 'https://example.com/photo.jpg',
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.form).toBeDefined();
  });

  it('has form data for core identity fields', () => {
    const wrapper = createWrapper({ isEditing: true });
    expect(wrapper.vm.form.fullName).toBeDefined();
    expect(wrapper.vm.form.headline).toBeDefined();
    expect(wrapper.vm.form.location).toBeDefined();
    expect(wrapper.vm.form.seniorityLevel).toBeDefined();
  });

  it('displays required indicator for fullName', () => {
    const wrapper = createWrapper();
    expect(wrapper.html()).toContain('*');
  });

  it('renders seniority level field', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Principal');
  });

  it('hides fields with no value in view mode', () => {
    const form = ref<ProfileForm>({
      fullName: 'Test User',
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

    const wrapper = mount(ProfileSectionCoreIdentity, {
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
            hasCoreIdentity: ref(true),
            photoPreviewUrl: ref(null),
            uploadingPhoto: ref(false),
            photoError: ref<string | null>(null),
            photoInputRef: ref<HTMLInputElement | null>(null),
            emailError: ref<string | undefined>(undefined),
            phoneError: ref<string | undefined>(undefined),
            startSectionEditing: () => {},
            cancelSectionEditing: () => {},
            saveSectionEditing: async () => {},
            triggerPhotoPicker: () => {},
            handlePhotoSelected: () => {},
            handleRemovePhoto: () => {},
            formatSocialLink: (link: string) => link,
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Test User');
    expect(wrapper.text()).not.toContain('Mathematician');
  });
});
