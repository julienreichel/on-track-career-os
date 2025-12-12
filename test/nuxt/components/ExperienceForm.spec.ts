import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import ExperienceForm from '~/components/ExperienceForm.vue';
import type { Experience } from '~/domain/experience/Experience';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      experiences: {
        form: {
          createTitle: 'Add Experience',
          editTitle: 'Edit Experience',
          title: 'Job Title',
          titlePlaceholder: 'e.g., Senior Software Engineer',
          company: 'Company Name',
          companyPlaceholder: 'e.g., Acme Corporation',
          startDate: 'Start Date',
          endDate: 'End Date',
          endDateHint: 'Leave empty if this is your current position',
          responsibilities: 'Responsibilities',
          responsibilitiesPlaceholder: 'Enter each responsibility on a new line',
          responsibilitiesHint: 'One responsibility per line',
          tasks: 'Tasks & Achievements',
          tasksPlaceholder: 'Enter each task or achievement on a new line',
          tasksHint: 'One task per line',
          status: 'Status',
          save: 'Save Experience',
          cancel: 'Cancel',
        },
        status: {
          draft: 'Draft',
          complete: 'Complete',
        },
      },
    },
  },
});

// Stub Nuxt UI components
const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UFormField: {
    name: 'UFormField',
    template:
      '<div class="u-form-field"><label>{{ label }}<slot name="label" /></label><slot /><slot name="hint" /></div>',
    props: ['label', 'required', 'hint'],
  },
  UInput: {
    name: 'UInput',
    template:
      '<input class="u-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'type'],
  },
  UTextarea: {
    name: 'UTextarea',
    template:
      '<textarea class="u-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'rows', 'resize'],
  },
  URadioGroup: {
    name: 'URadioGroup',
    template:
      '<div class="u-radio-group"><label v-for="item in items" :key="item.value"><input type="radio" :value="item.value" :checked="item.value === modelValue" @change="$emit(\'update:modelValue\', item.value)" /> {{ item.label }}</label></div>',
    props: ['modelValue', 'items'],
  },
  UButton: {
    name: 'UButton',
    template:
      '<button class="u-button" :type="type" :disabled="disabled || loading"><slot>{{ label }}</slot></button>',
    props: ['type', 'label', 'loading', 'disabled', 'color', 'variant'],
  },
};

const mockExperience: Experience = {
  id: '1',
  title: 'Senior Software Engineer',
  companyName: 'Tech Corp',
  startDate: '2020-01-01',
  endDate: '2023-12-31',
  responsibilities: ['Lead development', 'Mentor team'],
  tasks: ['Build features', 'Code reviews'],
  status: 'complete',
  userId: 'user-1',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  owner: 'user-1',
  rawText: '',
} as Experience;

describe('ExperienceForm', () => {
  const createWrapper = (props = {}) => {
    return mount(ExperienceForm, {
      props,
      global: {
        plugins: [i18n],
        stubs,
      },
    });
  };

  it('renders correctly', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.u-card').exists()).toBe(true);
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('displays create title when no experience provided', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Add Experience');
  });

  it('displays edit title when experience provided', () => {
    const wrapper = createWrapper({ experience: mockExperience });
    expect(wrapper.text()).toContain('Edit Experience');
  });

  it('renders all form fields', () => {
    const wrapper = createWrapper();
    expect(wrapper.findAll('.u-input').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.u-textarea').length).toBe(2);
    expect(wrapper.find('.u-radio-group').exists()).toBe(true);
  });

  it('displays field labels', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Job Title');
    expect(wrapper.text()).toContain('Company Name');
    expect(wrapper.text()).toContain('Start Date');
    expect(wrapper.text()).toContain('End Date');
    expect(wrapper.text()).toContain('Responsibilities');
    expect(wrapper.text()).toContain('Tasks & Achievements');
    expect(wrapper.text()).toContain('Status');
  });

  it('populates form with experience data', async () => {
    const wrapper = createWrapper({ experience: mockExperience });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll('.u-input');
    expect(
      inputs.some(
        (input) => (input.element as HTMLInputElement).value === 'Senior Software Engineer'
      )
    ).toBe(true);
    expect(inputs.some((input) => (input.element as HTMLInputElement).value === 'Tech Corp')).toBe(
      true
    );
  });

  it('emits save event with form data on submit', async () => {
    const wrapper = createWrapper();

    // Fill out the form
    const inputs = wrapper.findAll('.u-input');
    await inputs[0].setValue('Software Engineer');
    await inputs[1].setValue('Test Company');
    await inputs[2].setValue('2024-01-01');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')?.[0][0]).toMatchObject({
      title: 'Software Engineer',
      companyName: 'Test Company',
      startDate: '2024-01-01',
    });
  });

  it('emits cancel event when cancel button clicked', async () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('.u-button');
    const cancelButton = buttons.find((btn) => btn.text() === 'Cancel');

    await cancelButton?.trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('disables submit button when required fields are empty', () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('.u-button');
    const submitButton = buttons.find((btn) => btn.attributes('type') === 'submit');

    expect(submitButton?.attributes('disabled')).toBeDefined();
  });

  it('shows loading state on submit button', () => {
    const wrapper = createWrapper({ loading: true });
    const buttons = wrapper.findAll('.u-button');
    const submitButton = buttons.find((btn) => btn.attributes('type') === 'submit');

    expect(submitButton?.attributes('disabled')).toBeDefined();
  });

  it('converts responsibilities textarea to array', async () => {
    const wrapper = createWrapper();
    const textareas = wrapper.findAll('.u-textarea');

    await textareas[0].setValue('Responsibility 1\nResponsibility 2\nResponsibility 3');

    const inputs = wrapper.findAll('.u-input');
    await inputs[0].setValue('Test Title');
    await inputs[2].setValue('2024-01-01');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    const emittedData = wrapper.emitted('save')?.[0][0] as any;
    expect(emittedData.responsibilities).toEqual([
      'Responsibility 1',
      'Responsibility 2',
      'Responsibility 3',
    ]);
  });

  it('converts tasks textarea to array', async () => {
    const wrapper = createWrapper();
    const textareas = wrapper.findAll('.u-textarea');

    await textareas[1].setValue('Task 1\nTask 2');

    const inputs = wrapper.findAll('.u-input');
    await inputs[0].setValue('Test Title');
    await inputs[2].setValue('2024-01-01');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    const emittedData = wrapper.emitted('save')?.[0][0] as any;
    expect(emittedData.tasks).toEqual(['Task 1', 'Task 2']);
  });
});
