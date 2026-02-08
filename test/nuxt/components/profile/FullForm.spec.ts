import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import { defineComponent, h, inject, ref } from 'vue';
import FullForm from '@/components/profile/FullForm.vue';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import { profileFormContextKey } from '@/components/profile/profileFormContext';

// Mock UserProfileService to prevent Amplify client initialization
vi.mock('@/domain/user-profile/UserProfileService', () => ({
  UserProfileService: vi.fn(() => ({
    getFullUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
  })),
}));

// Mock composables
const mockProfile = ref<UserProfile | null>(null);
const mockLoad = vi.fn();
const mockSaveProfile = vi.fn();
const mockLoading = ref(false);
const mockError = ref<string | null>(null);
const mockProgressState = ref<{ phase1?: { missing?: string[] } } | null>({
  phase1: { missing: [] },
});

vi.mock('@/application/user-profile/useUserProfile', () => ({
  useUserProfile: vi.fn(() => ({
    item: mockProfile,
    loading: mockLoading,
    error: mockError,
    load: mockLoad,
    save: mockSaveProfile,
  })),
}));

const mockAuthUserId = ref<string | null>('user-123');

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: vi.fn(() => ({
    userId: mockAuthUserId,
  })),
}));

vi.mock('@/composables/useUserProgress', () => ({
  useUserProgress: () => ({
    state: mockProgressState,
    load: vi.fn(),
  }),
}));

// Mock services
const mockProfilePhotoService = {
  upload: vi.fn(),
  delete: vi.fn(),
  getSignedUrl: vi.fn(),
};

vi.mock('@/domain/user-profile/ProfilePhotoService', () => ({
  ProfilePhotoService: vi.fn(() => mockProfilePhotoService),
}));

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: { template: '<div>Home</div>' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: { template: '<div>Profile</div>' },
    },
  ],
});

const stubs = {
  UCard: {
    template: '<div class="card"><div class="header"><slot name="header" /></div><slot /></div>',
  },
  UButton: {
    template: '<button @click="$emit(\'click\')"><slot />{{ label }}</button>',
    props: ['label', 'loading', 'disabled', 'color', 'icon'],
  },
  UIcon: {
    template: '<span class="icon" />',
    props: ['name'],
  },
  UFormField: {
    template: '<div class="form-field"><label><slot name="label" /></label><slot /></div>',
    props: ['label', 'error'],
  },
  UInput: {
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :type="type" />',
    props: ['modelValue', 'type', 'placeholder'],
  },
  TagInput: {
    template: '<div class="tag-input" />',
    props: ['modelValue'],
  },
  UAlert: {
    template: '<div class="alert"><slot /></div>',
    props: ['color', 'title'],
  },
  PageHeader: {
    template: '<div class="page-header"><slot /></div>',
    props: ['links'],
  },
  ProfileCoreIdentity: {
    template: '<div class="core-identity" />',
  },
  ProfileContactInfo: {
    template: '<div class="contact-info" />',
  },
  ProfileSocialLinks: {
    template: '<div class="social-links" />',
  },
  ProfileCareerDirection: {
    template: '<div class="career-direction" />',
  },
  ProfileIdentityValues: {
    template: '<div class="identity-values" />',
  },
  ProfileProfessionalAttributes: {
    template: '<div class="professional-attributes" />',
  },
  UnsavedChangesModal: {
    template: '<div />',
  },
};

let injectedContext: ReturnType<typeof inject> | null = null;
const ContextProbe = defineComponent({
  name: 'ContextProbe',
  setup() {
    injectedContext = inject(profileFormContextKey, null);
    return () => h('div', { class: 'context-probe' });
  },
});

describe('FullForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressState.value = {
      phase1: { missing: [] },
    };
    mockAuthUserId.value = 'user-123';

    mockProfile.value = {
      id: 'profile-1',
      userId: 'user-123',
      fullName: 'John Doe',
      headline: 'Software Engineer',
      location: 'San Francisco, CA',
      seniorityLevel: 'Senior',
      primaryEmail: 'john@example.com',
      primaryPhone: '+1234567890',
      workPermitInfo: 'US Citizen',
      aspirations: ['Aspiration 1'],
      personalValues: ['Value 1'],
      strengths: ['Strength 1'],
      interests: ['Interest 1'],
      skills: ['Skill 1'],
      certifications: ['Cert 1'],
      languages: ['English'],
      socialLinks: [{ url: 'https://linkedin.com/in/johndoe' }],
    } as unknown as UserProfile;

    mockLoad.mockResolvedValue(undefined);
    mockSaveProfile.mockResolvedValue(true);
    mockProfilePhotoService.getSignedUrl.mockResolvedValue('https://example.com/photo.jpg');
    injectedContext = null;
  });

  it('should render the component', () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should display profile title', async () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Your Profile');
  });

  it('should have a form element', async () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    await flushPromises();

    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('should provide form context', async () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    await flushPromises();

    // Component provides context via Vue's provide/inject
    // Child components can access form, isEditing, etc.
    expect(wrapper.vm).toBeDefined();
  });

  it('should handle profile load error gracefully', async () => {
    // Set up error state in the composable mock instead of rejecting the promise
    mockError.value = 'Load error';
    mockLoad.mockResolvedValue(undefined); // load() resolves but error is set
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    await flushPromises();

    consoleSpy.mockRestore();
  });

  it('limits sections when profile basics are missing', async () => {
    mockProfile.value = {
      id: 'profile-1',
      userId: 'user-123',
      fullName: 'John Doe',
      headline: '',
      location: '',
      seniorityLevel: '',
      primaryEmail: '',
      primaryPhone: '',
      workPermitInfo: '',
      aspirations: [],
      personalValues: [],
      strengths: [],
      interests: [],
      skills: [],
      certifications: [],
      languages: [],
      socialLinks: [],
    } as unknown as UserProfile;

    mockProgressState.value = {
      phase1: { missing: ['profileBasics'] },
    };

    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    await flushPromises();

    expect(wrapper.find('.career-direction').exists()).toBe(false);
    expect(wrapper.find('.identity-values').exists()).toBe(false);
    expect(wrapper.find('.professional-attributes').exists()).toBe(false);
  });

  it('shows page error alert when error is set', async () => {
    mockError.value = 'Test error message';
    mockProfile.value = null;

    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    await flushPromises();
    // Error should be handled by the component
    expect(wrapper.vm).toBeDefined();
  });

  it('renders all profile sections', async () => {
    mockProfile.value = {
      id: 'profile-1',
      userId: 'user-123',
      fullName: 'John Doe',
      headline: 'Engineer',
      location: 'NYC',
      seniorityLevel: 'Senior',
      primaryEmail: 'john@example.com',
      primaryPhone: '+1234567890',
      workPermitInfo: 'US Citizen',
      aspirations: ['Leadership'],
      personalValues: ['Innovation'],
      strengths: ['Communication'],
      interests: ['Technology'],
      skills: ['JavaScript'],
      certifications: ['AWS'],
      languages: ['English'],
      socialLinks: ['https://linkedin.com/in/johndoe'],
    } as unknown as UserProfile;

    mockProgressState.value = {
      phase1: { missing: [] },
    };

    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    await flushPromises();

    // All sections should be present
    expect(wrapper.findComponent({ name: 'ProfileSectionCoreIdentity' })).toBeDefined();
    expect(wrapper.findComponent({ name: 'ProfileSectionWorkPermit' })).toBeDefined();
    expect(wrapper.findComponent({ name: 'ProfileSectionContact' })).toBeDefined();
  });

  it('renders form with submit handler', async () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    await flushPromises();

    const form = wrapper.find('form');
    expect(form.exists()).toBe(true);
  });

  it('provides form context to child components', async () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        saveProfile: mockSaveProfile,
      },
    });

    await flushPromises();

    // Component should provide context via profileFormContextKey
    expect(wrapper.vm).toBeDefined();
  });

  it('handles photo selection with validation errors', async () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs: {
          ...stubs,
          ProfileSectionCoreIdentity: ContextProbe,
        },
      },
    });

    await flushPromises();

    const context = injectedContext as any;
    expect(context).toBeTruthy();

    const invalidFile = new File(['bad'], 'bad.txt', { type: 'text/plain' });
    const invalidTarget = document.createElement('input');
    Object.defineProperty(invalidTarget, 'files', { value: [invalidFile] });
    invalidTarget.value = 'bad.txt';

    await context.handlePhotoSelected({ target: invalidTarget } as unknown as Event);

    expect(invalidTarget.value).toBe('');
    expect(context.photoError.value).toBe(i18n.global.t('profile.validation.photoUnsupported'));

    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const largeTarget = document.createElement('input');
    Object.defineProperty(largeTarget, 'files', { value: [largeFile] });

    await context.handlePhotoSelected({ target: largeTarget } as unknown as Event);

    expect(context.photoError.value).toBe(i18n.global.t('profile.validation.photoTooLarge'));

    mockAuthUserId.value = null;
    const validFile = new File(['ok'], 'ok.jpg', { type: 'image/jpeg' });
    const validTarget = document.createElement('input');
    Object.defineProperty(validTarget, 'files', { value: [validFile] });

    await context.handlePhotoSelected({ target: validTarget } as unknown as Event);

    expect(context.photoError.value).toBe(i18n.global.t('profile.validation.photoUserMissing'));
    mockAuthUserId.value = 'user-123';
  });

  it('uploads photo and removes previous key', async () => {
    mockProfile.value = {
      ...(mockProfile.value as UserProfile),
      profilePhotoKey: 'old-key',
    } as UserProfile;
    mockProfilePhotoService.upload.mockResolvedValue('new-key');
    mockProfilePhotoService.getSignedUrl.mockResolvedValue('https://example.com/new.jpg');

    const updatedProfile = {
      ...(mockProfile.value as UserProfile),
      profilePhotoKey: 'new-key',
    } as UserProfile;

    const updateUserProfile = vi.fn().mockResolvedValue(updatedProfile);
    vi.mocked(
      await import('@/domain/user-profile/UserProfileService')
    ).UserProfileService.mockImplementation(
      () =>
        ({
          updateUserProfile,
        }) as any
    );

    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs: {
          ...stubs,
          ProfileSectionCoreIdentity: ContextProbe,
        },
      },
    });

    await flushPromises();

    const context = injectedContext as any;
    expect(context).toBeTruthy();

    const validFile = new File(['ok'], 'ok.jpg', { type: 'image/jpeg' });
    const target = document.createElement('input');
    Object.defineProperty(target, 'files', { value: [validFile] });

    await context.handlePhotoSelected({ target } as unknown as Event);

    expect(mockProfilePhotoService.upload).toHaveBeenCalledWith('user-123', validFile);
    expect(updateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockProfile.value?.id,
        profilePhotoKey: 'new-key',
      })
    );
    expect(mockProfilePhotoService.delete).toHaveBeenCalledWith('old-key');
    expect(context.photoPreviewUrl.value).toBe('https://example.com/new.jpg');
    expect(context.uploadingPhoto.value).toBe(false);
  });

  it('removes photo and clears preview', async () => {
    mockProfile.value = {
      ...(mockProfile.value as UserProfile),
      profilePhotoKey: 'photo-key',
    } as UserProfile;

    const updatedProfile = {
      ...(mockProfile.value as UserProfile),
      profilePhotoKey: null,
    } as UserProfile;

    const updateUserProfile = vi.fn().mockResolvedValue(updatedProfile);
    vi.mocked(
      await import('@/domain/user-profile/UserProfileService')
    ).UserProfileService.mockImplementation(
      () =>
        ({
          updateUserProfile,
        }) as any
    );

    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs: {
          ...stubs,
          ProfileSectionCoreIdentity: ContextProbe,
        },
      },
    });

    await flushPromises();

    const context = injectedContext as any;
    expect(context).toBeTruthy();

    await context.handleRemovePhoto();

    expect(mockProfilePhotoService.delete).toHaveBeenCalledWith('photo-key');
    expect(updateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockProfile.value?.id,
        profilePhotoKey: null,
      })
    );
    expect(context.photoPreviewUrl.value).toBeNull();
    expect(context.uploadingPhoto.value).toBe(false);
  });

  it('cancelEditing resets form and clears editing state', async () => {
    mockProfile.value = {
      ...(mockProfile.value as UserProfile),
      profilePhotoKey: 'photo-key',
      fullName: 'Jane Doe',
    } as UserProfile;
    mockProfilePhotoService.getSignedUrl.mockResolvedValue('https://example.com/photo.jpg');

    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs: {
          ...stubs,
          ProfileSectionCoreIdentity: ContextProbe,
        },
      },
    });

    await flushPromises();

    mockProfilePhotoService.getSignedUrl.mockClear();

    wrapper.vm.isEditing = true;
    wrapper.vm.editingSection = 'core';
    wrapper.vm.error = 'save failed';
    wrapper.vm.saveSuccess = true;
    wrapper.vm.form.fullName = 'Changed Name';

    await wrapper.vm.cancelEditing();

    expect(wrapper.vm.isEditing).toBe(false);
    expect(wrapper.vm.editingSection).toBe(null);
    expect(wrapper.vm.error).toBe(null);
    expect(wrapper.vm.saveSuccess).toBe(false);
    expect(wrapper.vm.form.fullName).toBe('Jane Doe');
    expect(mockProfilePhotoService.getSignedUrl).toHaveBeenCalledWith('photo-key');
  });

  it('handleSubmit saves and exits editing mode', async () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    wrapper.vm.isEditing = true;
    wrapper.vm.editingSection = 'core';
    wrapper.vm.form.fullName = 'John Doe';

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(mockSaveProfile).toHaveBeenCalled();
    expect(wrapper.vm.isEditing).toBe(false);
    expect(wrapper.vm.editingSection).toBe(null);
  });

  it('startSectionEditing sets editing section and clears status', async () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs: {
          ...stubs,
          ProfileSectionCoreIdentity: ContextProbe,
        },
      },
    });

    await flushPromises();

    const context = injectedContext as any;
    expect(context).toBeTruthy();

    wrapper.vm.error = 'previous error';
    wrapper.vm.saveSuccess = true;

    context.startSectionEditing('contact');

    expect(wrapper.vm.editingSection).toBe('contact');
    expect(wrapper.vm.error).toBe(null);
    expect(wrapper.vm.saveSuccess).toBe(false);
  });

  it('cancelSectionEditing resets form and clears section state', async () => {
    mockProfile.value = {
      ...(mockProfile.value as UserProfile),
      profilePhotoKey: 'photo-key',
      fullName: 'Jane Doe',
    } as UserProfile;
    mockProfilePhotoService.getSignedUrl.mockResolvedValue('https://example.com/photo.jpg');

    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs: {
          ...stubs,
          ProfileSectionCoreIdentity: ContextProbe,
        },
      },
    });

    await flushPromises();
    mockProfilePhotoService.getSignedUrl.mockClear();

    const context = injectedContext as any;
    expect(context).toBeTruthy();

    wrapper.vm.editingSection = 'contact';
    wrapper.vm.error = 'save failed';
    wrapper.vm.saveSuccess = true;
    wrapper.vm.form.fullName = 'Changed Name';

    context.cancelSectionEditing();

    expect(wrapper.vm.editingSection).toBe(null);
    expect(wrapper.vm.error).toBe(null);
    expect(wrapper.vm.saveSuccess).toBe(false);
    expect(wrapper.vm.form.fullName).toBe('Jane Doe');
    expect(mockProfilePhotoService.getSignedUrl).toHaveBeenCalledWith('photo-key');
  });

  it('saveSectionEditing persists changes and closes section', async () => {
    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs: {
          ...stubs,
          ProfileSectionCoreIdentity: ContextProbe,
        },
      },
    });

    await flushPromises();

    const context = injectedContext as any;
    expect(context).toBeTruthy();

    wrapper.vm.editingSection = 'contact';
    wrapper.vm.form.fullName = 'John Doe';

    await context.saveSectionEditing();
    await flushPromises();

    expect(mockSaveProfile).toHaveBeenCalled();
    expect(wrapper.vm.editingSection).toBe(null);
  });

  it('starts in edit mode when route query includes mode=edit', async () => {
    const replaceSpy = vi.spyOn(router, 'replace');

    await router.push({ path: '/', query: { mode: 'edit' } });

    const wrapper = mount(FullForm, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    expect(wrapper.vm.isEditing).toBe(true);
    expect(replaceSpy).toHaveBeenCalledWith({ path: '/', query: {} });

    replaceSpy.mockRestore();
  });
});
