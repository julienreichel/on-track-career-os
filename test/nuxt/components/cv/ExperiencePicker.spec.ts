import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvExperiencePicker from '@/components/cv/ExperiencePicker.vue';
import type { Experience } from '@/domain/experience/Experience';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';

// Mock the repository
vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: {
    getAll: vi.fn(),
  },
}));

const i18n = createTestI18n();


const stubs = {
  UCard: {
    template:
      '<div class="card"><div class="header"><slot name="header" /></div><div class="body"><slot /></div></div>',
  },
  UButton: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'size', 'disabled', 'icon', 'to'],
    emits: ['click'],
  },
  UCheckbox: {
    template:
      '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
  },
  UBadge: {
    template: '<span class="badge"><slot /></span>',
    props: ['color', 'variant', 'size'],
  },
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
};

describe.skip('CvExperiencePicker', () => {
  const createMockExperience = (overrides: Partial<Experience> = {}): Experience => ({
    id: 'exp-1',
    userId: 'user-1',
    companyName: 'TechCorp',
    role: 'Senior Engineer',
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    isCurrent: false,
    description: 'Led development team',
    achievements: [],
    skills: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    vi.mocked(ExperienceRepository.getAll).mockResolvedValue([]);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Loading experiences...');
  });

  it('renders experience list when loaded', async () => {
    const experiences = [
      createMockExperience({ id: 'exp-1', companyName: 'TechCorp' }),
      createMockExperience({ id: 'exp-2', companyName: 'StartupCo' }),
    ];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick(); // Wait for async data load

    expect(wrapper.text()).toContain('TechCorp');
    expect(wrapper.text()).toContain('StartupCo');
  });

  it('displays empty state when no experiences', async () => {
    vi.mocked(ExperienceRepository.getAll).mockResolvedValue([]);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No experiences found');
    expect(wrapper.text()).toContain('Add your first experience');
  });

  it('displays role and company for each experience', async () => {
    const experiences = [
      createMockExperience({
        id: 'exp-1',
        role: 'Senior Engineer',
        companyName: 'TechCorp',
      }),
    ];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Senior Engineer');
    expect(wrapper.text()).toContain('TechCorp');
  });

  it('displays date range for experience', async () => {
    const experiences = [
      createMockExperience({
        id: 'exp-1',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
      }),
    ];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('2020');
    expect(wrapper.text()).toContain('2023');
  });

  it('shows "Current" badge for current experience', async () => {
    const experiences = [
      createMockExperience({
        id: 'exp-1',
        isCurrent: true,
        endDate: null,
      }),
    ];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.badge').text()).toContain('Current');
  });

  it('checks experiences that are in modelValue', async () => {
    const experiences = [
      createMockExperience({ id: 'exp-1' }),
      createMockExperience({ id: 'exp-2' }),
    ];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: ['exp-1'],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    expect(checkboxes[0].element.checked).toBe(true);
    expect(checkboxes[1].element.checked).toBe(false);
  });

  it('emits update:modelValue when experience selected', async () => {
    const experiences = [createMockExperience({ id: 'exp-1' })];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['exp-1']);
  });

  it('emits update:modelValue when experience deselected', async () => {
    const experiences = [createMockExperience({ id: 'exp-1' })];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: ['exp-1'],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(false);

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([]);
  });

  it('shows select all button', async () => {
    const experiences = [createMockExperience()];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.text() === 'Select All')).toBe(true);
  });

  it('selects all experiences when select all clicked', async () => {
    const experiences = [
      createMockExperience({ id: 'exp-1' }),
      createMockExperience({ id: 'exp-2' }),
    ];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const selectAllButton = wrapper.findAll('button').find((b) => b.text() === 'Select All');
    await selectAllButton?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['exp-1', 'exp-2']);
  });

  it('shows deselect all button when all selected', async () => {
    const experiences = [
      createMockExperience({ id: 'exp-1' }),
      createMockExperience({ id: 'exp-2' }),
    ];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: ['exp-1', 'exp-2'],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.text() === 'Deselect All')).toBe(true);
  });

  it('deselects all experiences when deselect all clicked', async () => {
    const experiences = [
      createMockExperience({ id: 'exp-1' }),
      createMockExperience({ id: 'exp-2' }),
    ];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: ['exp-1', 'exp-2'],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const deselectAllButton = wrapper.findAll('button').find((b) => b.text() === 'Deselect All');
    await deselectAllButton?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([]);
  });

  it('sorts experiences by most recent first', async () => {
    const experiences = [
      createMockExperience({ id: 'exp-1', startDate: '2020-01-01' }),
      createMockExperience({ id: 'exp-2', startDate: '2023-01-01' }),
    ];

    vi.mocked(ExperienceRepository.getAll).mockResolvedValue(experiences);

    const wrapper = mount(CvExperiencePicker, {
      props: {
        modelValue: [],
        userId: 'user-1',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const text = wrapper.text();
    const idx2023 = text.indexOf('2023');
    const idx2020 = text.indexOf('2020');
    expect(idx2023).toBeLessThan(idx2020);
  });
});
