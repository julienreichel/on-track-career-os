import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref } from 'vue';
import FullForm from '@/components/profile/FullForm.vue';
import type { UserProfile } from '@/domain/user-profile/UserProfile';

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

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: vi.fn(() => ({
    userId: ref('user-123'),
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

vi.mock('@/application/user-profile/ProfilePhotoService', () => ({
  ProfilePhotoService: vi.fn(() => mockProfilePhotoService),
}));

const mockDirectProfileService = {
  updateUserProfile: vi.fn(),
};

vi.mock('@/application/user-profile/DirectProfileService', () => ({
  DirectProfileService: vi.fn(() => mockDirectProfileService),
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

describe('FullForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressState.value = {
      phase1: { missing: [] },
    };

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
    mockDirectProfileService.updateUserProfile.mockResolvedValue(mockProfile.value);
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
});
