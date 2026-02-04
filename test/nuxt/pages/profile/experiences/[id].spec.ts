import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../../utils/createTestI18n';
import ExperienceDetailPage from '@/pages/profile/experiences/[experienceId]/index.vue';
import type { Experience } from '@/domain/experience/Experience';

const mockGet = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: vi.fn(() => ({
    get: mockGet,
    create: mockCreate,
    update: mockUpdate,
  })),
}));

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/profile/experiences/:experienceId',
      name: 'experiences-id',
      component: ExperienceDetailPage,
    },
    {
      path: '/profile/experiences',
      name: 'experiences',
      component: { template: '<div>Experiences</div>' },
    },
  ],
});

const stubs = {
  UPage: {
    template: '<div class="u-page"><slot /></div>',
  },
  UPageHeader: {
    props: ['title', 'links'],
    template:
      '<div class="u-page-header"><h1>{{ title }}</h1><a v-for="link in links" :key="link.to" :href="link.to">{{ link.label }}</a></div>',
  },
  UPageBody: {
    template: '<div class="u-page-body"><slot /></div>',
  },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}</div>',
  },
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UButton: {
    props: ['label', 'icon', 'variant', 'color'],
    template:
      '<button class="u-button" type="button" :aria-label="$attrs[\'aria-label\']" @click="$emit(\'click\')">{{ label }}<slot /></button>',
  },
  UIcon: {
    template: '<span class="u-icon" />',
  },
  ExperienceForm: {
    props: ['experience', 'loading'],
    template: '<div class="experience-form-stub" />',
  },
};

const sampleExperience = {
  id: 'exp-1',
  title: 'Lead Developer',
  companyName: 'Acme Systems',
  startDate: '2024-01-01',
  endDate: null,
  responsibilities: ['Lead the team'],
  tasks: ['Ship features'],
  rawText: '',
  status: 'complete',
  experienceType: 'work',
  userId: 'user-1',
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
} as Experience;

describe('Experience Detail Page', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockCreate.mockReset();
    mockUpdate.mockReset();
  });

  it('defaults to view mode for existing experience', async () => {
    mockGet.mockResolvedValue(sampleExperience);
    await router.push('/profile/experiences/exp-1');
    await router.isReady();

    const wrapper = mount(ExperienceDetailPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    expect(wrapper.find('.experience-form-stub').exists()).toBe(false);
    expect(wrapper.text()).toContain(sampleExperience.title);
    expect(wrapper.find('h1').text()).toBe(sampleExperience.title);

    const editLabel = i18n.global.t('common.actions.edit');
    const editButton = wrapper.find(`button[aria-label="${editLabel}"]`);
    expect(editButton.exists()).toBe(true);
    await editButton.trigger('click');

    await flushPromises();

    expect(wrapper.find('.experience-form-stub').exists()).toBe(true);
  });

  it('starts in edit mode for new experience', async () => {
    await router.push('/profile/experiences/new');
    await router.isReady();

    const wrapper = mount(ExperienceDetailPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    expect(wrapper.find('.experience-form-stub').exists()).toBe(true);
    expect(wrapper.find('h1').text()).toBe(i18n.global.t('experiences.form.createTitle'));
    expect(mockGet).not.toHaveBeenCalled();
  });
});
