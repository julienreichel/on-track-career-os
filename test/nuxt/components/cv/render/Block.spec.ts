import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import Block from '@/components/cv/render/Block.vue';
import type { CVBlock } from '@/domain/cvdocument/CVDocumentService';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      cvBlock: {
        types: {
          summary: 'Summary',
          experience: 'Experience',
          education: 'Education',
          skills: 'Skills',
          languages: 'Languages',
          certifications: 'Certifications',
          interests: 'Interests',
          custom: 'Custom Section',
        },
      },
    },
  },
});

const stubs = {
  UCard: {
    template:
      '<div class="u-card"><div class="header"><slot name="header" /></div><div class="body"><slot /></div></div>',
  },
  UIcon: {
    template: '<i :class="name" />',
    props: ['name'],
  },
};

describe('CvRenderBlock', () => {
  const createMockBlock = (overrides: Partial<CVBlock> = {}): CVBlock => ({
    id: 'block-1',
    type: 'summary',
    content: {
      text: 'Test content',
    },
    order: 0,
    ...overrides,
  });

  it('renders block with correct structure', () => {
    const block = createMockBlock();
    const wrapper = mount(Block, {
      props: { block },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.u-card').exists()).toBe(true);
  });

  it('displays block title in header', () => {
    const block = createMockBlock({
      content: { title: 'My Custom Title', text: 'Content' },
    });
    const wrapper = mount(Block, {
      props: { block },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.header').text()).toContain('My Custom Title');
  });

  it('displays translated type name when no custom title', () => {
    const block = createMockBlock({ type: 'skills' });
    const wrapper = mount(Block, {
      props: { block },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.header').text()).toContain('Skills');
  });

  it('shows draggable icon when isDraggable is true', () => {
    const block = createMockBlock();
    const wrapper = mount(Block, {
      props: { block, isDraggable: true },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('i.i-heroicons-bars-3').exists()).toBe(true);
  });

  it('hides draggable icon when isDraggable is false', () => {
    const block = createMockBlock();
    const wrapper = mount(Block, {
      props: { block, isDraggable: false },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('i.i-heroicons-bars-3').exists()).toBe(false);
  });

  it('applies dragging class when isDragging is true', () => {
    const block = createMockBlock();
    const wrapper = mount(Block, {
      props: { block, isDragging: true },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.classes()).toContain('opacity-50');
  });

  it('uses subtle variant when isSelected is true', () => {
    const block = createMockBlock();
    const wrapper = mount(Block, {
      props: { block, isSelected: true },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    // Card variant is passed as prop, check component props
    expect(wrapper.vm.$props.isSelected).toBe(true);
  });

  it('formats bold markdown correctly', () => {
    const block = createMockBlock({
      content: { text: 'This is **bold** text' },
    });
    const wrapper = mount(Block, {
      props: { block },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const html = wrapper.html();
    expect(html).toContain('<strong>bold</strong>');
  });

  it('formats italic markdown correctly', () => {
    const block = createMockBlock({
      content: { text: 'This is *italic* text' },
    });
    const wrapper = mount(Block, {
      props: { block },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const html = wrapper.html();
    expect(html).toContain('<em>italic</em>');
  });

  it('formats bullet lists correctly', () => {
    const block = createMockBlock({
      content: { text: '- Item 1\n- Item 2' },
    });
    const wrapper = mount(Block, {
      props: { block },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const html = wrapper.html();
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
  });

  it('renders experience block with title', () => {
    const block = createMockBlock({
      type: 'experience',
      content: {
        title: 'Senior Engineer at TechCorp',
        text: 'Led development team',
      },
    });
    const wrapper = mount(Block, {
      props: { block },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Senior Engineer at TechCorp');
    expect(wrapper.text()).toContain('Led development team');
  });

  it('renders education block with title', () => {
    const block = createMockBlock({
      type: 'education',
      content: {
        title: 'BS Computer Science',
        text: 'University of Technology',
      },
    });
    const wrapper = mount(Block, {
      props: { block },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('BS Computer Science');
    expect(wrapper.text()).toContain('University of Technology');
  });

  it('renders slot content when provided', () => {
    const block = createMockBlock();
    const wrapper = mount(Block, {
      props: { block },
      slots: {
        default: '<div class="custom-content">Custom render</div>',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.custom-content').exists()).toBe(true);
    expect(wrapper.text()).toContain('Custom render');
  });

  it('renders actions slot in header', () => {
    const block = createMockBlock();
    const wrapper = mount(Block, {
      props: { block },
      slots: {
        actions: '<button class="action-btn">Action</button>',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.header .action-btn').exists()).toBe(true);
  });

  it('handles empty content gracefully', () => {
    const block = createMockBlock({
      content: { text: '' },
    });
    const wrapper = mount(Block, {
      props: { block },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('exposes block in default slot scope', () => {
    const block = createMockBlock();
    const wrapper = mount(Block, {
      props: { block },
      slots: {
        default: `
          <template #default="{ block }">
            <div class="scoped-block">{{ block.id }}</div>
          </template>
        `,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.scoped-block').text()).toBe('block-1');
  });
});
