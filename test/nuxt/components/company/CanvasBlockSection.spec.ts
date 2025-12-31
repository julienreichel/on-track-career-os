import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasBlockSection from '@/components/company/CanvasBlockSection.vue';

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot /></div>',
  },
  TagInput: {
    props: ['modelValue', 'label', 'testId'],
    emits: ['update:modelValue'],
    template: `
      <div class="tag-input">
        <span class="label">{{ label }}</span>
        <button class="add" type="button" @click="$emit('update:modelValue', [...modelValue, 'AI'])">
          Add
        </button>
      </div>
    `,
  },
};

describe('CanvasBlockSection', () => {
  it('renders label and emits updates', async () => {
    const wrapper = mount(CanvasBlockSection, {
      props: {
        modelValue: [],
        label: 'Customer Segments',
        hint: 'Primary audiences',
      },
      global: { stubs },
    });

    expect(wrapper.find('.label').text()).toContain('Customer Segments');
    await wrapper.find('.add').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['AI']]);
  });
});
