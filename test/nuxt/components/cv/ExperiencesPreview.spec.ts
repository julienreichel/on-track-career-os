import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import ExperiencesPreview from '~/components/cv/ExperiencesPreview.vue';
import type { ExtractedExperience } from '~/domain/ai-operations/Experience';

// Create i18n instance for tests
const i18n = createTestI18n();

// Stub Nuxt UI components
const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UBadge: {
    name: 'UBadge',
    template: '<span class="u-badge"><slot /></span>',
    props: ['color'],
  },
  UIcon: {
    name: 'UIcon',
    template: '<span class="u-icon"></span>',
    props: ['name'],
  },
  UButton: {
    name: 'UButton',
    template:
      '<button class="u-button" v-bind="$attrs" @click="$attrs.onClick"><slot /></button>',
    props: ['icon', 'color', 'variant', 'size'],
  },
  ExperienceForm: {
    name: 'ExperienceForm',
    template: '<div class="experience-form"></div>',
    props: ['experience'],
    emits: ['save', 'cancel'],
  },
};

const mockExperiences: ExtractedExperience[] = [
  {
    title: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    experienceType: 'work',
    startDate: '2020-01',
    endDate: '2023-12',
    responsibilities: ['Lead development team', 'Architect solutions'],
    tasks: ['Build features', 'Code reviews'],
    status: 'draft',
  },
  {
    title: 'Software Engineer',
    companyName: 'StartUp Inc',
    experienceType: 'work',
    startDate: '2018-06',
    endDate: '',
    responsibilities: ['Develop web applications'],
    tasks: ['Implement features', 'Write tests'],
    status: 'draft',
  },
];

describe('ExperiencesPreview', () => {
  const createWrapper = (props = {}) => {
    return mount(ExperiencesPreview, {
      props: {
        experiences: mockExperiences,
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });
  };

  it('renders all experiences', () => {
    const wrapper = createWrapper();
    const experienceCards = wrapper.findAll('.u-card');
    // One for the container, two for individual experiences
    expect(experienceCards.length).toBeGreaterThanOrEqual(2);
  });

  it('displays experience title and company', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Senior Software Engineer');
    expect(wrapper.text()).toContain('Tech Corp');
  });

  it('displays experience count badge', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.u-badge').text()).toBe('2');
  });

  it('formats date range with end date', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('2020-01 - 2023-12');
  });

  it('formats date range for current position (no end date)', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('2018-06 - Present');
  });

  it('displays responsibilities list', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Lead development team');
    expect(wrapper.text()).toContain('Architect solutions');
  });

  it('displays tasks list', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Build features');
    expect(wrapper.text()).toContain('Code reviews');
  });

  it('emits remove event when remove button is clicked', async () => {
    const wrapper = createWrapper();
    await wrapper.find('[data-testid="experience-remove-0"]').trigger('click');

    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')?.[0]).toEqual([0]);
  });

  it('emits update event when experience is saved', async () => {
    const wrapper = createWrapper();
    await wrapper.find('[data-testid="experience-edit-0"]').trigger('click');
    await wrapper.findComponent({ name: 'ExperienceForm' }).vm.$emit('save', {
      title: 'Updated Role',
      companyName: 'Tech Corp',
      startDate: '2020-01',
      endDate: '',
      responsibilities: ['Updated responsibility'],
      tasks: [],
      rawText: '',
      status: 'draft',
      experienceType: 'work',
      userId: '',
    });

    expect(wrapper.emitted('update')).toBeTruthy();
    expect(wrapper.emitted('update')?.[0]?.[0]).toBe(0);
  });

  it('does not render when experiences array is empty', () => {
    const wrapper = createWrapper({ experiences: [] });
    expect(wrapper.find('.u-card').exists()).toBe(false);
  });

  it('handles experiences without responsibilities', () => {
    const experiencesWithoutResponsibilities: ExtractedExperience[] = [
      {
        title: 'Developer',
        companyName: 'Company',
        experienceType: 'work',
        startDate: '2020-01',
        endDate: '2021-01',
        responsibilities: [],
        tasks: ['Task 1'],
        status: 'draft',
      },
    ];

    const wrapper = createWrapper({ experiences: experiencesWithoutResponsibilities });
    expect(wrapper.text()).not.toContain('Responsibilities:');
  });

  it('handles experiences without tasks', () => {
    const experiencesWithoutTasks: ExtractedExperience[] = [
      {
        title: 'Developer',
        companyName: 'Company',
        experienceType: 'work',
        startDate: '2020-01',
        endDate: '2021-01',
        responsibilities: ['Responsibility 1'],
        tasks: [],
        status: 'draft',
      },
    ];

    const wrapper = createWrapper({ experiences: experiencesWithoutTasks });
    expect(wrapper.text()).not.toContain('Tasks & Achievements:');
  });
});
