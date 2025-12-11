import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import StoryBuilder from '../../../src/components/StoryBuilder.vue';
import type { STARStory } from '../../../src/domain/starstory/STARStory';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      stories: {
        builder: {
          situation: 'Situation',
          situationHint: 'Situation hint',
          situationPlaceholder: 'Enter situation',
          task: 'Task',
          taskHint: 'Task hint',
          taskPlaceholder: 'Enter task',
          action: 'Action',
          actionHint: 'Action hint',
          actionPlaceholder: 'Enter action',
          result: 'Result',
          resultHint: 'Result hint',
          resultPlaceholder: 'Enter result',
          achievements: 'Achievements',
          generateAchievements: 'Generate Achievements',
          achievementsList: 'Achievements List',
          achievementsHint: 'Achievements hint',
          achievementsPlaceholder: 'Add achievement',
          kpisList: 'KPIs List',
          kpisHint: 'KPIs hint',
          kpisPlaceholder: 'Add KPI',
        },
      },
      common: {
        cancel: 'Cancel',
        save: 'Save',
      },
    },
  },
});

const stubs = {
  UCard: {
    template: '<div class="card"><slot /><div class="footer"><slot name="footer" /></div></div>',
  },
  UFormField: {
    template:
      '<div class="form-field"><label>{{ label }}</label><div class="hint">{{ hint }}</div><slot /></div>',
    props: ['label', 'hint', 'required'],
  },
  UTextarea: {
    template:
      '<textarea v-model="internalValue" :placeholder="placeholder" @input="handleInput" />',
    props: ['modelValue', 'placeholder', 'rows'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const internalValue = props.modelValue;
      const handleInput = (event: Event) => {
        emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
      };
      return { internalValue, handleInput };
    },
  },
  UButton: {
    template: '<button :disabled="disabled" @click="$attrs.onClick">{{ label }}<slot /></button>',
    props: ['label', 'icon', 'variant', 'size', 'color', 'disabled'],
  },
  TagInput: {
    template: '<div class="tag-input"><slot /></div>',
    props: ['modelValue', 'label', 'hint', 'placeholder'],
    emits: ['update:modelValue'],
  },
};

describe('StoryBuilder', () => {
  it('renders in create mode with empty fields', () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    const textareas = wrapper.findAll('textarea');
    expect(textareas).toHaveLength(4);
    textareas.forEach((textarea) => {
      expect((textarea.element as HTMLTextAreaElement).value).toBe('');
    });
  });

  it('populates fields in edit mode', async () => {
    const story: STARStory = {
      id: 'story-1',
      situation: 'Test situation',
      task: 'Test task',
      action: 'Test action',
      result: 'Test result',
      achievements: ['Achievement 1'],
      kpiSuggestions: ['KPI 1'],
      experienceId: 'exp-1',
      owner: 'user-1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        story,
        experienceId: 'exp-1',
        mode: 'edit',
      },
    });

    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).situation).toBe('Test situation');
    expect((wrapper.vm as any).task).toBe('Test task');
    expect((wrapper.vm as any).action).toBe('Test action');
    expect((wrapper.vm as any).result).toBe('Test result');
  });

  it('renders all STAR field labels', () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    expect(wrapper.text()).toContain('Situation');
    expect(wrapper.text()).toContain('Task');
    expect(wrapper.text()).toContain('Action');
    expect(wrapper.text()).toContain('Result');
  });

  it('renders achievements section', () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    expect(wrapper.text()).toContain('Achievements');
    expect(wrapper.text()).toContain('Generate Achievements');
  });

  it('renders TagInputs for achievements and KPIs', () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    const tagInputs = wrapper.findAll('.tag-input');
    expect(tagInputs).toHaveLength(2);
  });

  it('disables generate achievements button when form is invalid', () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    const buttons = wrapper.findAll('button');
    const generateButton = buttons.find((b) => b.text().includes('Generate Achievements'));
    expect(generateButton?.attributes('disabled')).toBeDefined();
  });

  it('enables generate achievements button when all STAR fields are filled', async () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    // Fill all fields
    (wrapper.vm as any).situation = 'Test situation';
    (wrapper.vm as any).task = 'Test task';
    (wrapper.vm as any).action = 'Test action';
    (wrapper.vm as any).result = 'Test result';
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const generateButton = buttons.find((b) => b.text().includes('Generate Achievements'));
    expect(generateButton?.attributes('disabled')).toBeUndefined();
  });

  it('emits generateAchievements when button clicked', async () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    // Fill all fields to enable button
    (wrapper.vm as any).situation = 'Test situation';
    (wrapper.vm as any).task = 'Test task';
    (wrapper.vm as any).action = 'Test action';
    (wrapper.vm as any).result = 'Test result';
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const generateButton = buttons.find((b) => b.text().includes('Generate Achievements'));
    await generateButton?.trigger('click');

    expect(wrapper.emitted('generateAchievements')).toBeTruthy();
  });

  it('disables save button when form is invalid', () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    const buttons = wrapper.findAll('button');
    const saveButton = buttons.find((b) => b.text().includes('Save'));
    expect(saveButton?.attributes('disabled')).toBeDefined();
  });

  it('enables save button when form is valid', async () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    (wrapper.vm as any).situation = 'Test situation';
    (wrapper.vm as any).task = 'Test task';
    (wrapper.vm as any).action = 'Test action';
    (wrapper.vm as any).result = 'Test result';
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const saveButton = buttons.find((b) => b.text().includes('Save'));
    expect(saveButton?.attributes('disabled')).toBeUndefined();
  });

  it('emits save with story data when save button clicked', async () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    (wrapper.vm as any).situation = 'Test situation';
    (wrapper.vm as any).task = 'Test task';
    (wrapper.vm as any).action = 'Test action';
    (wrapper.vm as any).result = 'Test result';
    (wrapper.vm as any).achievements = ['Achievement 1'];
    (wrapper.vm as any).kpiSuggestions = ['KPI 1'];
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const saveButton = buttons.find((b) => b.text().includes('Save'));
    await saveButton?.trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
    const emittedData = wrapper.emitted('save')?.[0]?.[0];
    expect(emittedData).toEqual({
      situation: 'Test situation',
      task: 'Test task',
      action: 'Test action',
      result: 'Test result',
      achievements: ['Achievement 1'],
      kpiSuggestions: ['KPI 1'],
    });
  });

  it('emits cancel when cancel button clicked', async () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    const buttons = wrapper.findAll('button');
    const cancelButton = buttons.find((b) => b.text().includes('Cancel'));
    await cancelButton?.trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('updates achievements when generatedAchievements prop changes', async () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    await wrapper.setProps({
      generatedAchievements: {
        achievements: ['Generated 1', 'Generated 2'],
        kpiSuggestions: ['KPI 1', 'KPI 2'],
      },
    });

    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).achievements).toEqual(['Generated 1', 'Generated 2']);
    expect((wrapper.vm as any).kpiSuggestions).toEqual(['KPI 1', 'KPI 2']);
  });

  it('validates that all STAR fields must be non-empty', async () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    // Only fill three fields
    (wrapper.vm as any).situation = 'Test situation';
    (wrapper.vm as any).task = 'Test task';
    (wrapper.vm as any).action = 'Test action';
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).isValid()).toBe(false);
  });

  it('renders footer with cancel and save buttons', () => {
    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        experienceId: 'exp-1',
        mode: 'create',
      },
    });

    const footer = wrapper.find('.footer');
    expect(footer.exists()).toBe(true);
    expect(footer.text()).toContain('Cancel');
    expect(footer.text()).toContain('Save');
  });

  it('handles empty achievements array', async () => {
    const story: STARStory = {
      id: 'story-1',
      situation: 'Test',
      task: 'Test',
      action: 'Test',
      result: 'Test',
      achievements: [],
      kpiSuggestions: [],
      experienceId: 'exp-1',
      owner: 'user-1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    const wrapper = mount(StoryBuilder, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        story,
        experienceId: 'exp-1',
        mode: 'edit',
      },
    });

    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).achievements).toEqual([]);
    expect((wrapper.vm as any).kpiSuggestions).toEqual([]);
  });
});
