import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvTemplateEditor from '@/components/cv/CvTemplateEditor.vue';

const i18n = createTestI18n();

const stubs = {
  UFormField: {
    props: ['label'],
    template: '<label><span>{{ label }}</span><slot /></label>',
  },
  UInput: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  UTextarea: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
  },
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
  UCard: { template: '<div class="u-card"><slot /></div>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  MarkdownContent: {
    props: ['content'],
    template: '<div class="markdown">{{ content }}</div>',
  },
};

describe('CvTemplateEditor', () => {
  it('renders labels and emits updates', async () => {
    const wrapper = mount(CvTemplateEditor, {
      props: {
        name: 'Classic',
        content: '# Template',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('applications.cvs.templates.editor.nameLabel'));
    expect(wrapper.text()).toContain(i18n.global.t('applications.cvs.templates.editor.contentLabel'));
    expect(wrapper.text()).toContain(i18n.global.t('applications.cvs.templates.editor.preview'));

    const inputs = wrapper.findAll('input');
    await inputs[0]?.setValue('Updated name');
    const textareas = wrapper.findAll('textarea');
    await textareas[0]?.setValue('Updated content');

    expect(wrapper.emitted('update:name')?.[0]).toEqual(['Updated name']);
    expect(wrapper.emitted('update:content')?.[0]).toEqual(['Updated content']);
  });

  it('toggles preview visibility', async () => {
    const wrapper = mount(CvTemplateEditor, {
      props: {
        name: 'Classic',
        content: '# Template',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.markdown').exists()).toBe(false);

    const toggle = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes(i18n.global.t('applications.cvs.templates.editor.showPreview')));
    await toggle?.trigger('click');

    expect(wrapper.find('.markdown').exists()).toBe(true);
    expect(wrapper.text()).toContain(i18n.global.t('applications.cvs.templates.editor.hidePreview'));
    expect(wrapper.emitted('preview')).toBeTruthy();
  });

  it('renders preview content when provided', async () => {
    const wrapper = mount(CvTemplateEditor, {
      props: {
        name: 'Classic',
        content: '# Template',
        previewContent: 'Preview content',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const toggle = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes(i18n.global.t('applications.cvs.templates.editor.showPreview')));
    await toggle?.trigger('click');

    expect(wrapper.find('.markdown').text()).toContain('Preview content');
  });
});
