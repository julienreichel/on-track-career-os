import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import JobCard from '~/components/job/JobCard.vue';

const i18n = createTestI18n();

const stubs = {
  ItemCard: {
    name: 'ItemCard',
    props: ['title', 'subtitle', 'showDelete'],
    emits: ['view', 'edit', 'delete'],
    template: `
      <div class="item-card">
        <slot />
        <slot name="badges" />
        <slot name="actions" />
        <button class="edit" @click="$emit('edit')">edit</button>
        <button class="view" @click="$emit('view')">view</button>
        <button v-if="showDelete !== false" class="delete" @click="$emit('delete')">delete</button>
      </div>
    `,
  },
  UButton: {
    name: 'UButton',
    props: ['label', 'to', 'disabled'],
    template: `
      <button
        class="u-button"
        v-bind="$attrs"
        :data-to="to"
        :disabled="disabled"
        @click="$emit('click')"
      >
        {{ label }}
      </button>
    `,
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

  it('emits open event when view action triggered', async () => {
    const wrapper = createWrapper();
    const itemCard = wrapper.findComponent(stubs.ItemCard as any);
    await itemCard.vm.$emit('view');

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

  it('links to match page and never disabled', () => {
    const wrapper = createWrapper({
      job: { ...mockJob, status: 'draft' },
    });
    const button = wrapper.find('[data-testid="job-card-match"]');
    expect(button.attributes('data-to')).toBe(`/jobs/${mockJob.id}/match`);
    expect(button.attributes()).not.toHaveProperty('disabled');

    const enabledWrapper = createWrapper();
    const enabledButton = enabledWrapper.find('[data-testid="job-card-match"]');
    expect(enabledButton.attributes('data-to')).toBe(`/jobs/${mockJob.id}/match`);
    expect(enabledButton.attributes()).not.toHaveProperty('disabled');
  });
});
