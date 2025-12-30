import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import JobCard from '~/components/job/JobCard.vue';

const i18n = createTestI18n();

const stubs = {
  ItemCard: {
    name: 'ItemCard',
    props: ['title', 'subtitle', 'showDelete'],
    emits: ['edit', 'delete'],
    template: `
      <div class="item-card">
        <slot />
        <slot name="badges" />
        <slot name="actions" />
        <button class="edit" @click="$emit('edit')">edit</button>
        <button v-if="showDelete !== false" class="delete" @click="$emit('delete')">delete</button>
      </div>
    `,
  },
  UButton: {
    name: 'UButton',
    props: ['label'],
    template: '<button class="u-button" @click="$emit(\'click\')">{{ label }}</button>',
  },
  UBadge: {
    name: 'UBadge',
    props: ['color'],
    template: '<span class="u-badge"><slot /></span>',
  },
};

describe('JobCard', () => {
  const mockJob = {
    id: 'job-1',
    title: 'Senior Engineer',
    seniorityLevel: 'Senior',
    roleSummary: 'Owns the platform.',
    status: 'analyzed',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const createWrapper = (props = {}) =>
    mount(JobCard, {
      props: {
        job: mockJob,
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

  it('passes title and subtitle to ItemCard', () => {
    const wrapper = createWrapper();
    const itemCard = wrapper.findComponent(stubs.ItemCard as any);
    expect(itemCard.props('title')).toBe('Senior Engineer');
    expect(itemCard.props('subtitle')).toBe('Senior');
  });

  it('emits open event when edit action triggered', async () => {
    const wrapper = createWrapper();
    const itemCard = wrapper.findComponent(stubs.ItemCard as any);
    await itemCard.vm.$emit('edit');

    expect(wrapper.emitted('open')).toBeTruthy();
    expect(wrapper.emitted('open')?.[0]).toEqual(['job-1']);
  });

  it('emits delete event when delete action triggered', async () => {
    const wrapper = createWrapper();
    const itemCard = wrapper.findComponent(stubs.ItemCard as any);
    await itemCard.vm.$emit('delete');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual(['job-1']);
  });

  it('hides delete button when showDelete is false', () => {
    const wrapper = createWrapper({ showDelete: false });
    expect(wrapper.find('.delete').exists()).toBe(false);
  });
});
