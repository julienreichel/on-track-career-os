import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import ProfilePreview from '~/components/cv/ProfilePreview.vue';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

// Create i18n instance for tests
const i18n = createTestI18n();


// Stub child components
const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  CvSingleBadge: {
    name: 'CvSingleBadge',
    template: '<div class="cv-single-badge">{{ label }}: {{ value }}</div>',
    props: ['label', 'value'],
    emits: ['remove'],
  },
  CvBadgeList: {
    name: 'CvBadgeList',
    template: '<div class="cv-badge-list">{{ label }}: {{ items.join(", ") }}</div>',
    props: ['label', 'items'],
    emits: ['remove'],
  },
};

const mockProfile: ParseCvTextOutput['profile'] = {
  fullName: 'John Doe',
  headline: 'Senior Software Engineer',
  location: 'San Francisco, CA',
  seniorityLevel: 'Senior',
  goals: ['Lead team', 'Architect solutions'],
  aspirations: ['CTO', 'Technical Leader'],
  personalValues: ['Innovation', 'Collaboration'],
  strengths: ['Problem solving', 'Communication'],
  interests: ['AI', 'Cloud computing'],
  languages: ['English', 'Spanish'],
};

describe('ProfilePreview', () => {
  const createWrapper = (props = {}) => {
    return mount(ProfilePreview, {
      props: {
        profile: mockProfile,
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });
  };

  it('renders profile header', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Profile Information');
  });

  it('displays single value fields', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('Senior Software Engineer');
    expect(wrapper.text()).toContain('San Francisco, CA');
    expect(wrapper.text()).toContain('Senior');
  });

  it('displays array fields', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Lead team, Architect solutions');
    expect(wrapper.text()).toContain('CTO, Technical Leader');
    expect(wrapper.text()).toContain('Innovation, Collaboration');
  });

  it('emits removeField event for single fields', async () => {
    const wrapper = createWrapper();
    const singleBadges = wrapper.findAllComponents({ name: 'CvSingleBadge' });

    await singleBadges[0].vm.$emit('remove');

    expect(wrapper.emitted('removeField')).toBeTruthy();
    expect(wrapper.emitted('removeField')?.[0]).toEqual(['fullName']);
  });

  it('emits removeArrayItem event for array fields', async () => {
    const wrapper = createWrapper();
    const badgeLists = wrapper.findAllComponents({ name: 'CvBadgeList' });

    await badgeLists[0].vm.$emit('remove', 1);

    expect(wrapper.emitted('removeArrayItem')).toBeTruthy();
    expect(wrapper.emitted('removeArrayItem')?.[0]).toEqual(['goals', 1]);
  });

  it('does not render when profile has no data', () => {
    const emptyProfile: ParseCvTextOutput['profile'] = {
      fullName: '',
      headline: '',
      location: '',
      seniorityLevel: '',
      goals: [],
      aspirations: [],
      personalValues: [],
      strengths: [],
      interests: [],
      languages: [],
    };

    const wrapper = createWrapper({ profile: emptyProfile });
    expect(wrapper.find('.u-card').exists()).toBe(false);
  });

  it('renders only populated single value fields', () => {
    const partialProfile: ParseCvTextOutput['profile'] = {
      fullName: 'Jane Smith',
      headline: '',
      location: '',
      seniorityLevel: '',
      goals: [],
      aspirations: [],
      personalValues: [],
      strengths: [],
      interests: [],
      languages: [],
    };

    const wrapper = createWrapper({ profile: partialProfile });
    expect(wrapper.text()).toContain('Jane Smith');
    expect(wrapper.text()).not.toContain('Headline');
  });

  it('renders only populated array fields', () => {
    const partialProfile: ParseCvTextOutput['profile'] = {
      fullName: '',
      headline: '',
      location: '',
      seniorityLevel: '',
      goals: ['Goal 1'],
      aspirations: [],
      personalValues: [],
      strengths: [],
      interests: [],
      languages: [],
    };

    const wrapper = createWrapper({ profile: partialProfile });
    expect(wrapper.text()).toContain('Goals');
    expect(wrapper.text()).not.toContain('Aspirations');
  });

  it('handles null values in arrays', () => {
    const profileWithNulls: ParseCvTextOutput['profile'] = {
      ...mockProfile,
      goals: [],
    };

    const wrapper = createWrapper({ profile: profileWithNulls });
    expect(wrapper.text()).not.toContain('Goals:');
  });
});
