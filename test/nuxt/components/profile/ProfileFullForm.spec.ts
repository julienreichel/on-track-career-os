import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { nextTick, ref } from 'vue';
import ProfileFullForm from '@/components/profile/FullForm.vue';

const mockProfile = ref({
  id: 'user-123',
  fullName: 'Ada Lovelace',
  headline: 'Engineer',
  location: 'London',
  seniorityLevel: 'Principal',
  primaryEmail: 'ada@example.com',
  primaryPhone: '+41 12 345 67 89',
  workPermitInfo: 'Swiss Citizen',
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

const mockSave = vi.fn().mockResolvedValue(true);
const mockLoad = vi.fn().mockResolvedValue();
const mockRouterReplace = vi.fn();
const mockRouterPush = vi.fn();

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({ userId: ref('user-123') }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/profile/full', query: {} }),
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
  }),
}));

vi.mock('@/application/user-profile/useUserProfile', () => ({
  useUserProfile: () => ({
    item: mockProfile,
    loading: ref(false),
    error: ref(null),
    save: mockSave,
    load: mockLoad,
  }),
}));

vi.mock('@/domain/user-profile/UserProfileService', () => ({
  UserProfileService: vi.fn().mockImplementation(() => ({
    updateUserProfile: vi.fn().mockResolvedValue(mockProfile.value),
  })),
}));

vi.mock('@/domain/user-profile/ProfilePhotoService', () => ({
  ProfilePhotoService: vi.fn().mockImplementation(() => ({
    getSignedUrl: vi.fn().mockResolvedValue(null),
    upload: vi.fn().mockResolvedValue('key'),
    delete: vi.fn().mockResolvedValue(undefined),
  })),
}));

const i18n = createTestI18n();

const baseStubs = {
  UPage: {
    template: '<div class="u-page"><slot /></div>',
  },
  UPageHeader: {
    template: '<header class="u-header"><slot /></header>',
    props: ['title', 'description', 'links'],
  },
  UPageBody: {
    template: '<section class="u-body"><slot /></section>',
  },
  UAlert: {
    template: '<div class="u-alert"><slot /></div>',
    props: ['title'],
  },
  UButton: {
    template: '<button class="u-button" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'loading', 'color', 'variant'],
  },
  USkeleton: {
    template: '<div class="u-skeleton"></div>',
  },
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  ProfileSectionCoreIdentity: {
    template: '<div data-test="section-core"></div>',
  },
  ProfileSectionWorkPermit: {
    template: '<div data-test="section-work-permit"></div>',
  },
  ProfileSectionContact: {
    template: '<div data-test="section-contact"></div>',
  },
  ProfileSectionSocialLinks: {
    template: '<div data-test="section-social"></div>',
  },
  ProfileSectionCareerDirection: {
    template: '<div data-test="section-career"></div>',
  },
  ProfileSectionIdentityValues: {
    template: '<div data-test="section-identity"></div>',
  },
  ProfileSectionProfessionalAttributes: {
    template: '<div data-test="section-professional"></div>',
  },
};

describe('ProfileFullForm', () => {
  beforeEach(() => {
    mockProfile.value = {
      ...mockProfile.value,
      profilePhotoKey: null,
    };
    mockSave.mockClear();
    mockLoad.mockClear();
  });

  it('renders all profile sections and loads data', async () => {
    const wrapper = mount(ProfileFullForm, {
      global: {
        plugins: [i18n],
        stubs: baseStubs,
      },
    });

    await nextTick();
    await nextTick();

    expect(mockLoad).toHaveBeenCalled();
    expect(wrapper.find('[data-test="section-core"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="section-work-permit"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="section-professional"]').exists()).toBe(true);
  });
});
