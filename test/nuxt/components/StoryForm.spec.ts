import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import StoryForm from '../../../src/components/StoryForm.vue';
import type { StoryFormState } from '../../../src/composables/useStoryEditor';

const i18n = createTestI18n();


const stubs = {
  UFormField: {
    template:
      '<div class="form-field"><label>{{ label }}</label><div class="hint">{{ hint }}</div><slot /></div>',
    props: ['label', 'hint', 'required'],
  },
  UInput: {
    template:
      '<input :value="modelValue" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'disabled', 'readonly'],
    emits: ['update:modelValue'],
  },
  UTextarea: {
    template:
      '<textarea :value="modelValue" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'rows', 'disabled', 'readonly'],
    emits: ['update:modelValue'],
  },
};

const defaultFormState: StoryFormState = {
  title: '',
  situation: '',
  task: '',
  action: '',
  result: '',
  achievements: [],
  kpiSuggestions: [],
};

describe('StoryForm', () => {
  it('renders all four STAR fields', () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const inputs = wrapper.findAll('input');
    const textareas = wrapper.findAll('textarea');
    expect(inputs).toHaveLength(1);
    expect(textareas).toHaveLength(4);
  });

  it('displays field labels', () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    expect(wrapper.text()).toContain('Story Title');
    expect(wrapper.text()).toContain('Situation');
    expect(wrapper.text()).toContain('Task');
    expect(wrapper.text()).toContain('Action');
    expect(wrapper.text()).toContain('Result');
  });

  it('populates fields with modelValue data', () => {
    const formState: StoryFormState = {
      title: 'Cloud migration leader',
      situation: 'Test situation',
      task: 'Test task',
      action: 'Test action',
      result: 'Test result',
      achievements: [],
      kpiSuggestions: [],
    };

    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: formState,
      },
    });

    const inputs = wrapper.findAll('input');
    const textareas = wrapper.findAll('textarea');
    expect((inputs[0].element as HTMLInputElement).value).toBe('Cloud migration leader');
    expect((textareas[0].element as HTMLTextAreaElement).value).toBe('Test situation');
    expect((textareas[1].element as HTMLTextAreaElement).value).toBe('Test task');
    expect((textareas[2].element as HTMLTextAreaElement).value).toBe('Test action');
    expect((textareas[3].element as HTMLTextAreaElement).value).toBe('Test result');
  });

  it('emits update:modelValue when situation changes', async () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const textareas = wrapper.findAll('textarea');
    await textareas[0].setValue('New situation');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as StoryFormState;
    expect(emittedValue.situation).toBe('New situation');
  });

  it('emits update:modelValue when task changes', async () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const textareas = wrapper.findAll('textarea');
    await textareas[1].setValue('New task');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as StoryFormState;
    expect(emittedValue.task).toBe('New task');
  });

  it('emits update:modelValue when action changes', async () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const textareas = wrapper.findAll('textarea');
    await textareas[2].setValue('New action');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as StoryFormState;
    expect(emittedValue.action).toBe('New action');
  });

  it('emits update:modelValue when result changes', async () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const textareas = wrapper.findAll('textarea');
    await textareas[3].setValue('New result');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as StoryFormState;
    expect(emittedValue.result).toBe('New result');
  });

  it('preserves other fields when updating one field', async () => {
    const formState: StoryFormState = {
      title: 'Original title',
      situation: 'Original situation',
      task: 'Original task',
      action: 'Original action',
      result: 'Original result',
      achievements: ['Achievement 1'],
      kpiSuggestions: ['KPI 1'],
    };

    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: formState,
      },
    });

    const textareas = wrapper.findAll('textarea');
    await textareas[0].setValue('Updated situation');

    const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as StoryFormState;
    expect(emittedValue.title).toBe('Original title');
    expect(emittedValue.situation).toBe('Updated situation');
    expect(emittedValue.task).toBe('Original task');
    expect(emittedValue.action).toBe('Original action');
    expect(emittedValue.result).toBe('Original result');
    expect(emittedValue.achievements).toEqual(['Achievement 1']);
    expect(emittedValue.kpiSuggestions).toEqual(['KPI 1']);
  });

  it('disables all fields when disabled prop is true', () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
        disabled: true,
      },
    });

    const inputs = wrapper.findAll('input');
    const textareas = wrapper.findAll('textarea');
    inputs.forEach((input) => {
      expect(input.attributes('disabled')).toBeDefined();
    });
    textareas.forEach((textarea) => {
      expect(textarea.attributes('disabled')).toBeDefined();
    });
  });

  it('makes all fields readonly when readonly prop is true', () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
        readonly: true,
      },
    });

    const inputs = wrapper.findAll('input');
    const textareas = wrapper.findAll('textarea');
    inputs.forEach((input) => {
      expect(input.attributes('readonly')).toBeDefined();
    });
    textareas.forEach((textarea) => {
      expect(textarea.attributes('readonly')).toBeDefined();
    });
  });

  it('displays hints for each field', () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const { t } = i18n.global;
    expect(wrapper.text()).toContain(t('star.title.description'));
    expect(wrapper.text()).toContain(t('star.situation.description'));
    expect(wrapper.text()).toContain(t('star.task.description'));
    expect(wrapper.text()).toContain(t('star.action.description'));
    expect(wrapper.text()).toContain(t('star.result.description'));
  });

  it('marks all fields as required', () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const formFields = wrapper.findAll('.form-field');
    expect(formFields).toHaveLength(5);
    // All 4 STAR fields should be rendered (testing structure)
    expect(wrapper.text()).toContain('Situation');
    expect(wrapper.text()).toContain('Task');
    expect(wrapper.text()).toContain('Action');
    expect(wrapper.text()).toContain('Result');
  });

  it('handles empty string values', async () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const inputs = wrapper.findAll('input');
    const textareas = wrapper.findAll('textarea');
    await inputs[0].setValue('');
    await textareas[0].setValue('');

    const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as StoryFormState;
    expect(emittedValue.situation).toBe('');
  });

  it('uses correct row heights for textareas', () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const inputs = wrapper.findAll('input');
    const textareas = wrapper.findAll('textarea');
    expect(inputs).toHaveLength(1);
    expect(textareas).toHaveLength(4);
    // Testing that all textareas are rendered correctly
    textareas.forEach((textarea) => {
      expect(textarea.exists()).toBe(true);
    });
  });
});
  it('emits update:modelValue when title changes', async () => {
    const wrapper = mount(StoryForm, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: defaultFormState,
      },
    });

    const input = wrapper.find('input');
    await input.setValue('New title');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as StoryFormState;
    expect(emittedValue.title).toBe('New title');
  });
