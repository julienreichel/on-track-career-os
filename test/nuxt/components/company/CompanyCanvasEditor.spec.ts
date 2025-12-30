import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CompanyCanvasEditor from '@/components/company/CompanyCanvasEditor.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const stubs = {
  CanvasBlockSection: {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
      <div class="block-section">
        <span class="label">{{ label }}</span>
        <button type="button" class="add" @click="$emit('update:modelValue', [...modelValue, label])">
          Add
        </button>
      </div>
    `,
  },
  UCard: {
    template: '<div class="u-card"><slot /></div>',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
  UFormGroup: {
    props: ['label'],
    template: '<label class="u-form-group">{{ label }}<slot /></label>',
  },
  UTextarea: {
    props: ['value', 'disabled', 'placeholder'],
    emits: ['input'],
    template: `
      <textarea
        class="u-textarea"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('input', $event)"
      />
    `,
  },
  UButton: {
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template: `
      <button
        class="u-button"
        type="button"
        :disabled="disabled"
        @click="$emit('click')"
      >
        {{ label }}
      </button>
    `,
  },
};

const blocks = {
  customerSegments: [],
  valuePropositions: [],
  channels: [],
  customerRelationships: [],
  revenueStreams: [],
  keyResources: [],
  keyActivities: [],
  keyPartners: [],
  costStructure: [],
};

describe('CompanyCanvasEditor', () => {
  it('renders all block sections', () => {
    const wrapper = mount(CompanyCanvasEditor, {
      props: { blocks, summary: '', needsUpdate: true },
      global: { plugins: [createTestI18n()], stubs },
    });

    expect(wrapper.findAll('.block-section')).toHaveLength(9);
    expect(wrapper.text()).toContain('Company Canvas');
  });

  it('emits events for block updates, summary, and actions', async () => {
    const wrapper = mount(CompanyCanvasEditor, {
      props: { blocks, summary: '', needsUpdate: false },
      global: { plugins: [createTestI18n()], stubs },
    });

    await wrapper.find('.block-section .add').trigger('click');
    expect(wrapper.emitted('update:block')?.[0]?.[0]).toBeDefined();

    const textarea = wrapper.find('.u-textarea');
    await textarea.setValue('Updated summary');
    expect(wrapper.emitted('update:summary')?.[0]).toEqual(['Updated summary']);

    const buttons = wrapper.findAll('.u-button');
    await buttons[0].trigger('click');
    await buttons[1].trigger('click');
    expect(wrapper.emitted('regenerate')).toBeTruthy();
    expect(wrapper.emitted('save')).toBeTruthy();
  });
});
