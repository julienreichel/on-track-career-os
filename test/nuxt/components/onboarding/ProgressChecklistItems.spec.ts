import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProgressChecklistItems from '@/components/onboarding/ProgressChecklistItems.vue';

const stubs = {
  UIcon: {
    props: ['name'],
    template: '<span class="u-icon" :data-name="name"></span>',
  },
};

describe('ProgressChecklistItems', () => {
  it('renders labels and icon state', () => {
    const wrapper = mount(ProgressChecklistItems, {
      props: {
        items: [
          { gate: 'cvUploaded', label: 'Upload a CV', complete: true },
          { gate: 'experienceCount', label: 'Add experiences', complete: false },
        ],
      },
      global: {
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Upload a CV');
    expect(wrapper.text()).toContain('Add experiences');
    const icons = wrapper.findAll('.u-icon');
    expect(icons).toHaveLength(2);
    expect(icons[0]?.attributes('data-name')).toBe('i-heroicons-check-circle');
    expect(icons[1]?.attributes('data-name')).toBe('i-heroicons-minus-circle');
  });
});
