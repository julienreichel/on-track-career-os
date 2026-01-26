import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import ItemCard from '@/components/ItemCard.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    name: 'UCard',
    inheritAttrs: false,
    props: ['ui'],
    emits: ['click'],
    template: `
      <div class="u-card" @click="$emit('click', $event)">
        <slot name="header" />
        <slot />
        <slot name="footer" />
      </div>
    `,
  },
  UButton: {
    props: ['label', 'ariaLabel'],
    emits: ['click'],
    template: '<button type="button" :aria-label="ariaLabel" @click="$emit(\'click\', $event)">{{ label }}</button>',
  },
};

describe('ItemCard', () => {
  it('emits view when the card is clicked', async () => {
    const wrapper = mount(ItemCard, {
      props: { title: 'Card title' },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('.u-card').trigger('click');

    expect(wrapper.emitted('view')).toBeTruthy();
  });

  it('does not emit view when edit is clicked', async () => {
    const wrapper = mount(ItemCard, {
      props: { title: 'Card title' },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const editButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Edit'));
    await editButton?.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('view')).toBeFalsy();
  });
});
