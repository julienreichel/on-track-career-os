import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import CvBlockEditor from '@/components/cv/render/BlockEditor.vue';
import type { CVBlock } from '@/domain/cvdocument/CVDocumentService';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      cvBlockEditor: {
        title: 'Edit Block',
        fields: {
          title: 'Title',
          content: 'Content',
        },
        placeholders: {
          title: 'Enter section title...',
          content: 'Enter content...',
        },
        formatting: {
          title: 'Formatting',
          bold: 'bold',
          italic: 'italic',
          bullet: 'Bullet point',
        },
        actions: {
          cancel: 'Cancel',
          save: 'Save',
        },
      },
    },
  },
});

const stubs = {
  UModal: {
    template: '<div v-if="modelValue" class="modal"><slot /></div>',
    props: ['modelValue'],
  },
  UCard: {
    template:
      '<div class="card"><div class="header"><slot name="header" /></div><div class="body"><slot /></div><div class="footer"><slot name="footer" /></div></div>',
  },
  UButton: {
    template:
      '<button :icon="icon" :disabled="loading ? true : (disabled || undefined)" @click="$emit(\'click\')"><slot /></button>',
    props: ['icon', 'color', 'variant', 'size', 'loading', 'disabled'],
    emits: ['click'],
  },
  UFormGroup: {
    template: '<div class="form-group"><label>{{ label }}</label><slot /></div>',
    props: ['label', 'name', 'required'],
  },
  UInput: {
    template:
      '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
  },
  UTextarea: {
    template:
      '<textarea :value="modelValue" :placeholder="placeholder" :rows="rows" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'rows', 'autoresize'],
    emits: ['update:modelValue'],
  },
};

describe('CvBlockEditor', () => {
  const createMockBlock = (overrides: Partial<CVBlock> = {}): CVBlock => ({
    id: 'block-1',
    type: 'summary',
    content: {
      text: 'Initial content',
    },
    order: 0,
    ...overrides,
  });

  it('renders modal when modelValue is true', () => {
    const block = createMockBlock();
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.modal').exists()).toBe(true);
  });

  it('does not render modal when modelValue is false', () => {
    const block = createMockBlock();
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: false,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.modal').exists()).toBe(false);
  });

  it('initializes with block content', () => {
    const block = createMockBlock({
      content: {
        title: 'Test Title',
        text: 'Test Content',
      },
    });
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.element.value).toBe('Test Content');
  });

  it('shows title field for experience blocks', () => {
    const block = createMockBlock({ type: 'experience' });
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('shows title field for education blocks', () => {
    const block = createMockBlock({ type: 'education' });
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('shows title field for custom blocks', () => {
    const block = createMockBlock({ type: 'custom' });
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('hides title field for summary blocks', () => {
    const block = createMockBlock({ type: 'summary' });
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(0);
  });

  it('updates content on textarea input', async () => {
    const block = createMockBlock();
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('New content');

    expect(textarea.element.value).toBe('New content');
  });

  it('emits save event with updated content', async () => {
    const block = createMockBlock();
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('Updated content');

    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save');
    await saveButton?.trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
    const emittedValue = wrapper.emitted('save')?.[0]?.[0] as { content: string };
    expect(emittedValue.content).toBe('Updated content');
  });

  it('emits save event with title for applicable blocks', async () => {
    const block = createMockBlock({ type: 'experience' });
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const input = wrapper.find('input');
    await input.setValue('New Title');

    const textarea = wrapper.find('textarea');
    await textarea.setValue('New Content');

    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save');
    await saveButton?.trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
    const emittedValue = wrapper.emitted('save')?.[0]?.[0] as { title: string; content: string };
    expect(emittedValue.title).toBe('New Title');
    expect(emittedValue.content).toBe('New Content');
  });

  it('emits update:modelValue when cancel button clicked', async () => {
    const block = createMockBlock();
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const cancelButton = wrapper.findAll('button').find((b) => b.text() === 'Cancel');
    await cancelButton?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe(false);
  });

  it('emits update:modelValue when close button clicked', async () => {
    const block = createMockBlock();
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const closeButtons = wrapper.findAll('button');
    const closeButton = closeButtons.find((b) => b.attributes('icon') === 'i-heroicons-x-mark');
    expect(closeButton).toBeTruthy();
    await closeButton!.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe(false);
  });

  it('shows loading state on save button', () => {
    const block = createMockBlock();
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
        saving: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    const saveButton = buttons.find((b) => b.text().includes('Save'));
    expect(saveButton).toBeTruthy();
    expect(saveButton!.attributes('disabled')).toBeDefined();
  });

  it('displays formatting help text', () => {
    const block = createMockBlock();
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Formatting');
    expect(wrapper.text()).toContain('bold');
    expect(wrapper.text()).toContain('italic');
  });

  it('resets form when block changes', async () => {
    const block1 = createMockBlock({
      id: 'block-1',
      content: { text: 'Content 1' },
    });
    const block2 = createMockBlock({
      id: 'block-2',
      content: { text: 'Content 2' },
    });

    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block: block1,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.setProps({ block: block2 });

    const textarea = wrapper.find('textarea');
    expect(textarea.element.value).toBe('Content 2');
  });

  it('handles null block gracefully', () => {
    const wrapper = mount(CvBlockEditor, {
      props: {
        modelValue: true,
        block: null,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.element.value).toBe('');
  });
});
