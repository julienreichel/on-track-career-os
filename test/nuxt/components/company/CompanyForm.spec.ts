import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CompanyForm from '@/components/company/CompanyForm.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const stubs = {
  UFormGroup: {
    props: ['label', 'hint'],
    template: '<label class="u-form-group">{{ label }}<slot /></label>',
  },
  UInput: {
    inheritAttrs: false,
    props: ['value', 'disabled', 'placeholder'],
    emits: ['input'],
    template: `
      <input
        class="u-input"
        :value="value"
        :disabled="disabled"
        :placeholder="placeholder"
        @input="$emit('input', $event)"
      />
    `,
  },
  UTextarea: {
    props: ['value', 'disabled', 'rows', 'placeholder'],
    emits: ['input'],
    template: `
      <textarea
        class="u-textarea"
        :value="value"
        :disabled="disabled"
        :rows="rows"
        :placeholder="placeholder"
        @input="$emit('input', $event)"
      />
    `,
  },
  TagInput: {
    props: ['modelValue', 'label', 'testId'],
    emits: ['update:modelValue'],
    template: `
      <div class="tag-input">
        <span>{{ label }}</span>
        <button class="add-tag" type="button" @click="$emit('update:modelValue', [...modelValue, 'New Tag'])">
          Add
        </button>
      </div>
    `,
  },
};

const defaultForm = {
  companyName: '',
  industry: '',
  sizeRange: '',
  website: '',
  productsServices: [],
  targetMarkets: [],
  customerSegments: [],
  description: '',
};

describe('CompanyForm', () => {
  it('renders all primary sections', () => {
    const wrapper = mount(CompanyForm, {
      props: { modelValue: defaultForm },
      global: { plugins: [createTestI18n()], stubs },
    });

    expect(wrapper.text()).toContain('Company name');
    expect(wrapper.findAll('.tag-input')).toHaveLength(3);
  });

  it('emits updated model when fields change', async () => {
    const wrapper = mount(CompanyForm, {
      props: { modelValue: defaultForm },
      global: { plugins: [createTestI18n()], stubs },
    });

    const input = wrapper.find('input.u-input');
    await input.setValue('Atlas Robotics');

    const updateEvent = wrapper.emitted('update:modelValue');
    expect(updateEvent).toBeTruthy();
    const lastEmitted = updateEvent?.at(-1)?.[0];
    expect(lastEmitted.companyName).toBe('Atlas Robotics');
  });

  it('emits updates from tag inputs', async () => {
    const wrapper = mount(CompanyForm, {
      props: { modelValue: defaultForm },
      global: { plugins: [createTestI18n()], stubs },
    });

    await wrapper.find('.tag-input .add-tag').trigger('click');
    const last = wrapper.emitted('update:modelValue')?.at(-1)?.[0];
    expect(last.productsServices).toEqual(['New Tag']);
  });
});
