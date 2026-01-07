import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot /></div>',
  },
  USkeleton: {
    template: '<div class="u-skeleton"></div>',
  },
};

describe('ListSkeletonCards', () => {
  it('renders three card skeletons by default', () => {
    const wrapper = mount(ListSkeletonCards, {
      global: {
        stubs,
      },
    });

    expect(wrapper.findAll('.u-card')).toHaveLength(3);
    expect(wrapper.findAll('.u-skeleton').length).toBeGreaterThan(0);
  });

  it('renders the provided count', () => {
    const wrapper = mount(ListSkeletonCards, {
      props: { count: 5 },
      global: {
        stubs,
      },
    });

    expect(wrapper.findAll('.u-card')).toHaveLength(5);
  });
});
