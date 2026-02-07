import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CvExperienceMultiSelect from '@/components/cv/CvExperienceMultiSelect.vue';
import type { Experience } from '@/domain/experience/Experience';

const experiences: Experience[] = [
  {
    id: 'exp-1',
    userId: 'user-1',
    title: 'Engineer',
    companyName: 'Acme',
    startDate: '2021-01-01',
    endDate: null,
  } as Experience,
  {
    id: 'exp-2',
    userId: 'user-1',
    title: 'Lead',
    companyName: 'Beta',
    startDate: '2019-01-01',
    endDate: '2020-01-01',
  } as Experience,
];

const stubs = {
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}<slot /></button>',
  },
  UIcon: { template: '<span class="icon"></span>' },
  UCard: {
    props: ['variant'],
    template: '<div class="card" :data-variant="variant" @click="$emit(\'click\')"><slot /></div>',
  },
  UCheckbox: {
    props: ['modelValue'],
    emits: ['click'],
    template: '<input type="checkbox" :checked="modelValue" @click="$emit(\'click\')" />',
  },
};

const requireItem = <T>(item: T | undefined, label: string): T => {
  if (!item) {
    throw new Error(`Expected ${label} to be present`);
  }
  return item;
};

describe('CvExperienceMultiSelect', () => {
  it('renders empty state when no experiences', () => {
    const wrapper = mount(CvExperienceMultiSelect, {
      props: {
        experiences: [],
        modelValue: [],
        emptyLabel: 'No experiences yet',
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain('No experiences yet');
  });

  it('emits updates when toggling a card', async () => {
    const wrapper = mount(CvExperienceMultiSelect, {
      props: {
        experiences,
        modelValue: [],
        selectAllLabel: 'Select all',
      },
      global: { stubs },
    });

    const cards = wrapper.findAll('.card');
    await requireItem(cards[0], 'experience card').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['exp-1']]);
  });

  it('selects all when the select all button is clicked', async () => {
    const wrapper = mount(CvExperienceMultiSelect, {
      props: {
        experiences,
        modelValue: [],
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
      },
      global: { stubs },
    });

    const button = wrapper.findAll('button').find((btn) => btn.text() === 'Select all');
    await requireItem(button, 'select all button').trigger('click');

    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['exp-1', 'exp-2']]);
  });
});
