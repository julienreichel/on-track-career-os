import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CompanyCanvasEditor from '@/components/company/CompanyCanvasEditor.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const stubs = {
  CanvasBlockSection: {
    props: ['modelValue', 'label', 'testId', 'readOnly', 'emptyLabel'],
    emits: ['update:modelValue'],
    template: `
      <div class="block-section">
        <span class="label">{{ label }}</span>
        <button
          type="button"
          class="add"
          :disabled="readOnly"
          @click="$emit('update:modelValue', [...modelValue, label])"
        >
          Add
        </button>
      </div>
    `,
  },
  UCard: {
    template: `
      <div class="u-card">
        <div class="u-card-header"><slot name="header" /></div>
        <div class="u-card-body"><slot /></div>
        <div class="u-card-footer"><slot name="footer" /></div>
      </div>
    `,
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
  UIcon: {
    template: '<span class="u-icon"></span>',
    props: ['name'],
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

const i18n = createTestI18n();

describe('CompanyCanvasEditor', () => {
  it('renders all block sections', () => {
    const wrapper = mount(CompanyCanvasEditor, {
      props: { blocks, summary: '', needsUpdate: true },
      global: { plugins: [i18n], stubs },
    });

    expect(wrapper.findAll('.block-section')).toHaveLength(9);
    expect(wrapper.text()).toContain('Company Canvas');
  });

  it('emits events for block updates and actions', async () => {
    const wrapper = mount(CompanyCanvasEditor, {
      props: { blocks, summary: '', needsUpdate: false },
      global: { plugins: [i18n], stubs },
    });

    const buttons = wrapper.findAll('.u-button');
    const generateButton = buttons.find((button) =>
      button.text().includes(i18n.global.t('companies.canvas.actions.generate'))
    );
    const editButton = buttons.find((button) =>
      button.text().includes(i18n.global.t('common.edit'))
    );

    expect(generateButton).toBeDefined();
    expect(editButton).toBeDefined();
    await generateButton!.trigger('click');
    await editButton!.trigger('click');

    await wrapper.find('.block-section .add').trigger('click');
    expect(wrapper.emitted('update:block')?.[0]?.[0]).toBeDefined();

    const saveButton = wrapper
      .findAll('.u-button')
      .find((button) => button.text() === i18n.global.t('common.save'));
    expect(saveButton).toBeDefined();
    await saveButton!.trigger('click');
    expect(wrapper.emitted('regenerate')).toBeTruthy();
    expect(wrapper.emitted('save')).toBeTruthy();
  });
});
