import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import GeneratingStep from '@/components/cv/GeneratingStep.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    template: '<div class="card"><div class="header"><slot name="header" /></div><slot /></div>',
  },
  USkeleton: {
    template: '<div class="skeleton"></div>',
    props: ['class'],
  },
};

describe('GeneratingStep', () => {
  it('should render the component', () => {
    const wrapper = mount(GeneratingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should display generating title', () => {
    const wrapper = mount(GeneratingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Generating Your CV');
  });

  it('should display generating description', () => {
    const wrapper = mount(GeneratingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(
      'AI is crafting your professional CV based on your experiences...'
    );
  });

  it('should render card wrapper', () => {
    const wrapper = mount(GeneratingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.card').exists()).toBe(true);
  });

  it('should render card header', () => {
    const wrapper = mount(GeneratingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.header').exists()).toBe(true);
  });

  it('should render multiple skeleton loaders', () => {
    const wrapper = mount(GeneratingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const skeletons = wrapper.findAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(3);
  });

  it('should render exactly 5 skeleton loaders', () => {
    const wrapper = mount(GeneratingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const skeletons = wrapper.findAll('.skeleton');
    expect(skeletons).toHaveLength(5);
  });

  it('should have centered layout classes', () => {
    const wrapper = mount(GeneratingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const content = wrapper.find('.flex');
    expect(content.exists()).toBe(true);
    expect(content.classes()).toContain('items-center');
    expect(content.classes()).toContain('justify-center');
  });

  it('should have vertical spacing between elements', () => {
    const wrapper = mount(GeneratingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const content = wrapper.find('.space-y-4');
    expect(content.exists()).toBe(true);
  });
});
