import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ErrorStateCard from '@/components/common/ErrorStateCard.vue';

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot /></div>',
  },
  UButton: {
    props: ['label'],
    template: '<button class="u-button">{{ label }}</button>',
  },
};

describe('ErrorStateCard', () => {
  it('renders deterministic structure and emits retry', async () => {
    const wrapper = mount(ErrorStateCard, {
      props: {
        title: 'Unable to evaluate',
        description: 'Please retry.',
        retryLabel: 'Retry',
      },
      global: {
        stubs,
      },
    });

    expect(wrapper.find('.u-card').exists()).toBe(true);
    expect(wrapper.find('h3').text()).toBe('Unable to evaluate');
    expect(wrapper.find('p').text()).toBe('Please retry.');
    await wrapper.find('.u-button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });
});
