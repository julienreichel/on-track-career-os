import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { ref } from 'vue';
import ProfileSectionSocialLinks from '@/components/profile/section/SocialLinks.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import type { ProfileForm } from '@/components/profile/types';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UIcon: {
    template: '<span class="u-icon"></span>',
  },
  TagInput: {
    template: '<div class="tag-input"><slot /></div>',
    props: ['modelValue', 'label', 'testId'],
  },
};

const mountSection = (isEditing = false, links: string[] = ['https://example.com']) => {
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
    socialLinks: links,
  });

  return mount(ProfileSectionSocialLinks, {
    global: {
      plugins: [i18n],
      stubs,
      provide: {
        [profileFormContextKey as symbol]: {
          form,
          isEditing: ref(isEditing),
          hasSocialLinks: ref(true),
          formatSocialLink: (link: string) => link,
        },
      },
    },
  });
};

describe('ProfileSectionSocialLinks', () => {
  it('renders links in view mode', () => {
    const wrapper = mountSection(false, ['https://github.com/ada']);
    expect(wrapper.text()).toContain('https://github.com/ada');
  });

  it('renders empty state when no links', () => {
    const wrapper = mountSection(false, []);
    expect(wrapper.text()).toContain('No social links added yet');
  });

  it('renders tag input in edit mode', () => {
    const wrapper = mountSection(true);
    expect(wrapper.find('.tag-input').exists()).toBe(true);
  });
});
