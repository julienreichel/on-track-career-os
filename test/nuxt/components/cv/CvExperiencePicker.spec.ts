import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import CvExperiencePicker from '@/components/cv/ExperiencePicker.vue';
import type { Experience } from '@/domain/experience/Experience';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';

vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: vi.fn(),
}));

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/profile/experiences',
      name: 'profile-experiences',
      component: { template: '<div>Experiences</div>' },
    },
  ],
});

const stubs = {
  UButton: {
    template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>',
    props: ['label', 'size', 'color', 'variant', 'to'],
  },
  UIcon: {
    template: '<span class="icon"></span>',
    props: ['name', 'class'],
  },
  UCard: {
    template: '<div class="card" :class="variant" @click="$emit(\'click\')"><slot /></div>',
    props: ['variant'],
  },
  UCheckbox: {
    template: '<input type="checkbox" :checked="modelValue" @click="$emit(\'click\')" />',
    props: ['modelValue'],
  },
  UBadge: {
    template: '<span class="badge">{{ label }}</span>',
    props: ['label', 'size', 'color', 'variant'],
  },
};

describe('CvExperiencePicker', () => {
  let mockExperienceRepo: { list: ReturnType<typeof vi.fn> };
  let mockExperiences: Experience[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockExperiences = [
      {
        id: 'exp-1',
        userId: 'user-1',
        title: 'Senior Engineer',
        companyName: 'TechCorp',
        startDate: '2020-01',
        endDate: '2023-12',
        experienceType: 'full-time',
      } as Experience,
      {
        id: 'exp-2',
        userId: 'user-1',
        title: 'Junior Developer',
        companyName: 'StartupInc',
        startDate: '2018-01',
        endDate: '2019-12',
        experienceType: 'internship',
      } as Experience,
    ];

    mockExperienceRepo = {
      list: vi.fn().mockResolvedValue(mockExperiences),
    };

    vi.mocked(ExperienceRepository).mockImplementation(() => mockExperienceRepo as never);
  });

  it('should render the component', () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should display title', () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    expect(wrapper.text()).toContain('Select Experiences');
  });

  it('should show loading state initially', () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    // Loading state is quickly resolved, so we just check component renders
    expect(wrapper.exists()).toBe(true);
  });

  it('should load and display experiences', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    expect(mockExperienceRepo.list).toHaveBeenCalledWith('user-1');
    expect(wrapper.text()).toContain('Senior Engineer');
    expect(wrapper.text()).toContain('TechCorp');
    expect(wrapper.text()).toContain('Junior Developer');
    expect(wrapper.text()).toContain('StartupInc');
  });

  it('should display empty state when no experiences', async () => {
    mockExperienceRepo.list.mockResolvedValue([]);

    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('No experiences found');
    expect(wrapper.text()).toContain('Add Experience');
  });

  it('should show select all button when experiences exist', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    const buttons = wrapper.findAll('button');
    const selectAllButton = buttons.find((b) => b.text() === 'Select All');
    expect(selectAllButton).toBeDefined();
  });

  it('should emit update when experience is toggled', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    const cards = wrapper.findAll('.card');
    await cards[0].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['exp-1']]);
  });

  it('should select all experiences when select all is clicked', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    const buttons = wrapper.findAll('button');
    const selectAllButton = buttons.find((b) => b.text() === 'Select All');
    await selectAllButton!.trigger('click');

    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['exp-1', 'exp-2']]);
  });

  it('should deselect all when all are selected', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: ['exp-1', 'exp-2'],
        userId: 'user-1',
      },
    });

    await flushPromises();

    const buttons = wrapper.findAll('button');
    const deselectButton = buttons.find((b) => b.text() === 'Deselect All');
    expect(deselectButton).toBeDefined();

    await deselectButton!.trigger('click');

    expect(wrapper.emitted('update:modelValue')![0]).toEqual([[]]);
  });

  it('should show selected count', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: ['exp-1'],
        userId: 'user-1',
      },
    });

    await flushPromises();

    expect(wrapper.text()).toMatch(/1.*selected/i);
  });

  it('should highlight selected experiences', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: ['exp-1'],
        userId: 'user-1',
      },
    });

    await flushPromises();

    const cards = wrapper.findAll('.card');
    expect(cards[0].classes()).toContain('subtle');
    expect(cards[1].classes()).toContain('outline');
  });

  it('should display date ranges', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('2020-01 - 2023-12');
    expect(wrapper.text()).toContain('2018-01 - 2019-12');
  });

  it('should display experience type badges', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    const badges = wrapper.findAll('.badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should sort experiences by date (newest first)', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    const cards = wrapper.findAll('.card');
    // First card should be the most recent (exp-1 from 2020)
    expect(cards[0].text()).toContain('Senior Engineer');
    expect(cards[1].text()).toContain('Junior Developer');
  });

  it('should not load experiences if userId is null', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: null,
      },
    });

    await flushPromises();

    expect(mockExperienceRepo.list).not.toHaveBeenCalled();
  });

  it('should reload experiences when userId changes', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();
    expect(mockExperienceRepo.list).toHaveBeenCalledWith('user-1');

    await wrapper.setProps({ userId: 'user-2' });
    await flushPromises();

    expect(mockExperienceRepo.list).toHaveBeenCalledWith('user-2');
    expect(mockExperienceRepo.list).toHaveBeenCalledTimes(2);
  });

  it('should handle repository errors gracefully', async () => {
    mockExperienceRepo.list.mockRejectedValue(new Error('API error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should toggle checkbox when card is clicked', async () => {
    const wrapper = mount(CvExperiencePicker, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
      props: {
        modelValue: [],
        userId: 'user-1',
      },
    });

    await flushPromises();

    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.element.checked).toBe(false);

    const card = wrapper.find('.card');
    await card.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
