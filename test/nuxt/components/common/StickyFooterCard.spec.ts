import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StickyFooterCard from '@/components/common/StickyFooterCard.vue';

const stubs = {
  UCard: {
    template: '<div class="u-card" :class="$attrs.class"><slot name="footer" /></div>',
  },
};

describe('StickyFooterCard', () => {
  it('renders sticky card with default footer layout', () => {
    const wrapper = mount(StickyFooterCard, {
      global: { stubs },
      slots: {
        default: '<button class="action">Action</button>',
      },
    });

    const card = wrapper.find('.u-card');
    expect(card.exists()).toBe(true);
    expect(card.classes()).toEqual(expect.arrayContaining(['sticky', 'bottom-0', 'z-10']));

    const footer = wrapper.find('.flex');
    expect(footer.exists()).toBe(true);
    expect(footer.classes()).toEqual(expect.arrayContaining(['justify-end', 'gap-2']));
    expect(footer.find('.action').exists()).toBe(true);
  });

  it('applies custom card and footer classes', () => {
    const wrapper = mount(StickyFooterCard, {
      props: {
        cardClass: 'bg-muted',
        footerClass: 'justify-between gap-4',
      },
      global: { stubs },
      slots: {
        default: '<span>Controls</span>',
      },
    });

    const card = wrapper.find('.u-card');
    expect(card.classes()).toEqual(expect.arrayContaining(['bg-muted']));

    const footer = wrapper.find('.justify-between');
    expect(footer.exists()).toBe(true);
    expect(footer.classes()).toEqual(expect.arrayContaining(['gap-4']));
    expect(footer.text()).toContain('Controls');
  });
});
