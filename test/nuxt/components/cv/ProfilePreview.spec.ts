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
  TagInput: {
    name: 'TagInput',
    template: '<div class="tag-input">{{ modelValue?.join(", ") }}</div>',
    props: ['label', 'modelValue', 'editable'],
    emits: ['update:modelValue'],
  },
};

const mockProfile: ParseCvTextOutput['profile'] = {
  fullName: 'John Doe',
  headline: 'Senior Software Engineer',
  location: 'San Francisco, CA',
  seniorityLevel: 'Senior',
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
    expect(wrapper.text()).toContain('CTO, Technical Leader');
    expect(wrapper.text()).toContain('Innovation, Collaboration');
  });

  it('emits updateField event for single fields', async () => {
    const wrapper = createWrapper();
    const tagInputs = wrapper.findAllComponents({ name: 'TagInput' });

    await tagInputs[0].vm.$emit('update:modelValue', ['New Name']);

    expect(wrapper.emitted('updateField')).toBeTruthy();
    expect(wrapper.emitted('updateField')?.[0]).toEqual(['fullName', 'New Name']);
  });

  it('emits updateArrayField event for array fields', async () => {
    const wrapper = createWrapper();
    const tagInputs = wrapper.findAllComponents({ name: 'TagInput' });

    await tagInputs[4].vm.$emit('update:modelValue', ['CTO', 'Chief Engineer']);

    expect(wrapper.emitted('updateArrayField')).toBeTruthy();
    expect(wrapper.emitted('updateArrayField')?.[0]).toEqual([
      'aspirations',
      ['CTO', 'Chief Engineer'],
    ]);
  });

  it('does not render when profile has no data', () => {
    const emptyProfile: ParseCvTextOutput['profile'] = {
      fullName: '',
      headline: '',
      location: '',
      seniorityLevel: '',
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
      aspirations: ['Aspiration 1'],
      personalValues: [],
      strengths: [],
      interests: [],
      languages: [],
    };

    const wrapper = createWrapper({ profile: partialProfile });
    expect(wrapper.text()).toContain('Aspirations');
  });

  it('handles null values in arrays', () => {
    const profileWithNulls: ParseCvTextOutput['profile'] = {
      ...mockProfile,
      aspirations: [],
    };

    const wrapper = createWrapper({ profile: profileWithNulls });
    expect(wrapper.text()).not.toContain('Aspirations:');
  });
});
