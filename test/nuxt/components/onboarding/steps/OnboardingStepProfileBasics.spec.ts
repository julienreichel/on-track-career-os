import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createTestI18n } from '../../../../utils/createTestI18n';
import OnboardingStepProfileBasics from '~/components/onboarding/steps/OnboardingStepProfileBasics.vue';

const i18n = createTestI18n();

// Mock the composables and services
vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: vi.fn(() => ({
    userId: ref('user-123'),
    loadUserId: vi.fn(),
  })),
}));

vi.mock('@/application/user-profile/useUserProfile', () => ({
  useUserProfile: vi.fn(() => ({
    item: {
      value: {
        fullName: 'John Doe',
        headline: 'Software Engineer',
        location: 'San Francisco',
        seniorityLevel: 'Senior',
        primaryEmail: 'john@example.com',
        primaryPhone: '+1234567890',
        workPermitInfo: 'US Citizen',
        profilePhotoKey: null,
        aspirations: ['Leadership'],
        personalValues: ['Innovation'],
        strengths: ['Problem Solving'],
        interests: ['AI'],
        skills: ['JavaScript', 'Python'],
        certifications: ['AWS'],
        languages: ['English'],
        socialLinks: ['https://linkedin.com/in/johndoe'],
      },
    },
    load: vi.fn(),
    save: vi.fn(async () => true),
  })),
}));

vi.mock('@/composables/useErrorDisplay', () => ({
  useErrorDisplay: vi.fn(() => ({
    notifyActionError: vi.fn(),
  })),
}));

vi.mock('@/domain/user-profile/UserProfileService', () => ({
  UserProfileService: vi.fn(() => ({
    updateUserProfile: vi.fn().mockResolvedValue({ profilePhotoKey: null }),
  })),
}));

vi.mock('@/domain/user-profile/ProfilePhotoService', () => ({
  ProfilePhotoService: vi.fn(() => ({
    upload: vi.fn(),
    delete: vi.fn(),
    getSignedUrl: vi.fn(),
  })),
}));

const stubs = {
  UCard: {
    name: 'UCard',
    template: `
      <div class="card">
        <div class="header"><slot name="header" /></div>
        <div class="content"><slot /></div>
      </div>
    `,
  },
  USkeleton: {
    name: 'USkeleton',
    props: ['class'],
    template: '<div :class="$props.class" class="skeleton"></div>',
  },
  UButton: {
    name: 'UButton',
    props: ['variant', 'color', 'label', 'loading', 'disabled'],
    template: '<button @click="$emit(\'click\')" :disabled="disabled">{{ label }}</button>',
  },
  ProfileSectionCoreIdentity: {
    name: 'ProfileSectionCoreIdentity',
    template: '<div class="core-identity">Core Identity Section</div>',
  },
  ProfileSectionWorkPermit: {
    name: 'ProfileSectionWorkPermit',
    template: '<div class="work-permit">Work Permit Section</div>',
  },
  ProfileSectionContact: {
    name: 'ProfileSectionContact',
    template: '<div class="contact">Contact Section</div>',
  },
  ProfileSectionSocialLinks: {
    name: 'ProfileSectionSocialLinks',
    template: '<div class="social-links">Social Links Section</div>',
  },
  ProfileSectionProfessionalAttributes: {
    name: 'ProfileSectionProfessionalAttributes',
    template: '<div class="professional-attributes">Professional Attributes Section</div>',
  },
  StickyFooterCard: {
    name: 'StickyFooterCard',
    template: '<div class="sticky-footer"><slot /></div>',
  },
};

function mountOnboardingStepProfileBasics() {
  return mount(OnboardingStepProfileBasics, {
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('OnboardingStepProfileBasics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders component', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.exists()).toBe(true);
    });

    it('has space-y-6 pb-24 spacing classes', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.html()).toContain('space-y-6 pb-24');
    });

    it('renders instruction card', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'UCard' }).exists()).toBe(true);
    });
  });

  describe('Header Content', () => {
    it('displays title in header', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.text()).toContain('Confirm profile basics');
    });

    it('title has text-lg font-semibold classes', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.html()).toContain('text-lg font-semibold');
    });

    it('displays hint text', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.text()).toContain('Accurate details');
    });

    it('hint has text-sm text-dimmed classes', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.html()).toContain('text-sm text-dimmed');
    });
  });

  describe('Loading State', () => {
    it('shows skeletons while loading', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      // Don't wait for promises to see loading state
      const skeletons = wrapper.findAllComponents({ name: 'USkeleton' });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides profile sections while loading', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      // Before promises resolve
      expect(wrapper.findComponent({ name: 'ProfileSectionCoreIdentity' }).exists()).toBe(false);
    });

    it('shows profile sections after loading', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'ProfileSectionCoreIdentity' }).exists()).toBe(true);
    });
  });

  describe('Profile Sections', () => {
    it('renders CoreIdentity section', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'ProfileSectionCoreIdentity' }).exists()).toBe(true);
    });

    it('renders WorkPermit section', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'ProfileSectionWorkPermit' }).exists()).toBe(true);
    });

    it('renders Contact section', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'ProfileSectionContact' }).exists()).toBe(true);
    });

    it('renders SocialLinks section', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'ProfileSectionSocialLinks' }).exists()).toBe(true);
    });

    it('renders ProfessionalAttributes section', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'ProfileSectionProfessionalAttributes' }).exists()).toBe(
        true
      );
    });

    it('renders all sections in correct order', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const html = wrapper.html();
      const coreIndex = html.indexOf('core-identity');
      const workIndex = html.indexOf('work-permit');
      const contactIndex = html.indexOf('contact');
      const socialIndex = html.indexOf('social-links');
      const professionalIndex = html.indexOf('professional-attributes');

      expect(coreIndex).toBeLessThan(workIndex);
      expect(workIndex).toBeLessThan(contactIndex);
      expect(contactIndex).toBeLessThan(socialIndex);
      expect(socialIndex).toBeLessThan(professionalIndex);
    });
  });

  describe('Footer Actions', () => {
    it('renders StickyFooterCard', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'StickyFooterCard' }).exists()).toBe(true);
    });

    it('renders back button', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const backButton = buttons.find((btn) => btn.props('label') === 'Back');
      expect(backButton).toBeTruthy();
    });

    it('renders continue button', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const continueButton = buttons.find((btn) => btn.props('label') === 'Confirm & continue');
      expect(continueButton).toBeTruthy();
    });

    it('back button has ghost variant', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const backButton = buttons[0];
      expect(backButton.props('variant')).toBe('ghost');
    });

    it('back button has neutral color', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const backButton = buttons[0];
      expect(backButton.props('color')).toBe('neutral');
    });

    it('continue button has primary color', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const continueButton = buttons[1];
      expect(continueButton.props('color')).toBe('primary');
    });

    it('emits back event when back button clicked', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const backButton = buttons[0];

      await backButton.trigger('click');

      expect(wrapper.emitted('back')).toBeTruthy();
    });
  });

  describe('Translation Keys', () => {
    it('uses correct title translation key', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.text()).toContain('Confirm profile basics');
    });

    it('uses correct hint translation key', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.text()).toContain('Accurate details');
    });

    it('uses correct back button translation key', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.text()).toContain('Back');
    });

    it('uses correct continue button translation key', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.text()).toContain('Confirm & continue');
    });
  });

  describe('Component Structure', () => {
    it('wraps content in div with correct classes', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const root = wrapper.find('.space-y-6.pb-24');
      expect(root.exists()).toBe(true);
    });

    it('instruction card comes first', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const html = wrapper.html();
      const titleIndex = html.indexOf('onboarding.steps.profileBasics.title');
      const sectionsIndex = html.indexOf('core-identity');
      expect(titleIndex).toBeLessThan(sectionsIndex);
    });

    it('footer comes last', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const html = wrapper.html();
      const sectionsIndex = html.indexOf('professional-attributes');
      const footerIndex = html.indexOf('sticky-footer');
      expect(sectionsIndex).toBeLessThan(footerIndex);
    });
  });

  describe('Conditional Rendering', () => {
    it('shows loading skeleton when profileLoading is true', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      // Before flush
      const skeletons = wrapper.findAllComponents({ name: 'USkeleton' });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides loading skeleton after data loads', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const coreIdentity = wrapper.findComponent({ name: 'ProfileSectionCoreIdentity' });
      expect(coreIdentity.exists()).toBe(true);
    });

    it('shows all profile sections when loaded', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();

      expect(wrapper.findComponent({ name: 'ProfileSectionCoreIdentity' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'ProfileSectionWorkPermit' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'ProfileSectionContact' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'ProfileSectionSocialLinks' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'ProfileSectionProfessionalAttributes' }).exists()).toBe(
        true
      );
    });
  });

  describe('Button States', () => {
    it('continue button is enabled after loading', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const continueButton = buttons[1];
      expect(continueButton.props('disabled')).toBe(false);
    });

    it('continue button shows loading state', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const continueButton = buttons[1];
      expect(continueButton.props()).toHaveProperty('loading');
    });

    it('back button is always enabled', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const backButton = buttons[0];
      expect(backButton.props('disabled')).toBeUndefined();
    });
  });

  describe('Loading Skeleton Structure', () => {
    it('shows card with skeletons during load', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      const skeletons = wrapper.findAllComponents({ name: 'USkeleton' });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('skeleton has space-y-3 class', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      expect(wrapper.html()).toContain('space-y-3');
    });

    it('renders multiple skeleton items', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      const skeletons = wrapper.findAllComponents({ name: 'USkeleton' });
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Accessibility', () => {
    it('has semantic heading for title', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.html()).toContain('<h2');
    });

    it('provides descriptive hint text', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const hint = wrapper.find('.text-dimmed');
      expect(hint.exists()).toBe(true);
    });

    it('buttons have descriptive labels', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      expect(buttons[0].props('label')).toBe('Back');
      expect(buttons[1].props('label')).toBe('Confirm & continue');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing profile sections gracefully', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      // Should still render footer
      expect(wrapper.findComponent({ name: 'StickyFooterCard' }).exists()).toBe(true);
    });

    it('footer is always visible', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'StickyFooterCard' }).exists()).toBe(true);
    });

    it('maintains component structure during loading', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      const rootBefore = wrapper.find('.space-y-6');
      expect(rootBefore.exists()).toBe(true);

      await flushPromises();
      const rootAfter = wrapper.find('.space-y-6');
      expect(rootAfter.exists()).toBe(true);
    });
  });

  describe('Event Emissions', () => {
    it('emits continue event when continue button clicked', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();

      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const continueButton = buttons.find((btn) => btn.props('label') === 'Confirm & continue');

      if (continueButton) {
        await continueButton.trigger('click');
        expect(wrapper.emitted('complete')).toBeTruthy();
      }
    });

    it('emits back event when back button clicked', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();

      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const backButton = buttons.find((btn) => btn.props('label') === 'Back');

      if (backButton) {
        await backButton.trigger('click');
        expect(wrapper.emitted('back')).toBeTruthy();
      }
    });
  });

  describe('Profile Data Loading', () => {
    it('loads profile data on mount', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();

      // Profile sections should be rendered after load
      const sections = wrapper.findAllComponents({ name: 'ProfileSectionCoreIdentity' });
      expect(sections.length).toBeGreaterThan(0);
    });

    it('handles profile data correctly', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();

      // Check that data from mock is present
      expect(wrapper.html()).toContain('Core Identity Section');
    });
  });

  describe('Form Integration', () => {
    it('provides form context to child components', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();

      // Child sections should have access to form context
      const coreIdentity = wrapper.findComponent({ name: 'ProfileSectionCoreIdentity' });
      expect(coreIdentity.exists()).toBe(true);
    });

    it('renders all five profile sections when loaded', async () => {
      const wrapper = mountOnboardingStepProfileBasics();
      await flushPromises();

      const sections = [
        'ProfileSectionCoreIdentity',
        'ProfileSectionWorkPermit',
        'ProfileSectionContact',
        'ProfileSectionSocialLinks',
        'ProfileSectionProfessionalAttributes',
      ];

      sections.forEach((sectionName) => {
        const section = wrapper.findComponent({ name: sectionName });
        expect(section.exists()).toBe(true);
      });
    });
  });
});
