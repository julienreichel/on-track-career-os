import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MarkdownContent from '@/components/MarkdownContent.vue';

describe('MarkdownContent', () => {
  it('renders markdown as HTML', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        content: 'Hello **world**\\n\\n- One\\n- Two',
      },
    });

    expect(wrapper.html()).toContain('<strong>world</strong>');
    expect(wrapper.html()).toContain('<p>');
    expect(wrapper.text()).toContain('Hello');
  });

  it('renders empty output for missing content', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        content: '',
      },
    });

    expect(wrapper.text()).toBe('');
  });
});
