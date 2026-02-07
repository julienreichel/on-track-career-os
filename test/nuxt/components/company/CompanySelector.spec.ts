import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CompanySelector from '@/components/company/Selector.vue';
import type { Company } from '@/domain/company/Company';
import { createTestI18n } from '../../../utils/createTestI18n';

const companies: Company[] = [
  {
    id: 'company-1',
    companyName: 'Acme Robotics',
    industry: 'Robotics',
    sizeRange: '51-200',
  },
  {
    id: 'company-2',
    companyName: 'Global Freight',
    industry: 'Logistics',
    sizeRange: '201-500',
  },
] as Company[];

const stubs = {
  UInput: {
    props: ['modelValue', 'placeholder', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <input
        class="u-input"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
  UButton: {
    props: ['label', 'disabled'],
    emits: ['click'],
    template: `
      <button class="u-button" type="button" :disabled="disabled" @click="$emit('click')">
        <slot>{{ label }}</slot>
      </button>
    `,
  },
  USkeleton: {
    template: '<div class="u-skeleton"></div>',
  },
};

const requireItem = <T>(item: T | undefined, label: string): T => {
  if (!item) {
    throw new Error(`Expected ${label} to be present`);
  }
  return item;
};

describe('CompanySelector', () => {
  it('filters and emits selection', async () => {
    const wrapper = mount(CompanySelector, {
      props: {
        modelValue: null,
        companies,
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    const search = wrapper.find('[data-testid="company-selector-search"]');
    await search.setValue('freight');

    const options = wrapper.findAll('[data-testid="company-selector-option"]');
    expect(options).toHaveLength(1);

    await requireItem(options[0], 'company option').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['company-2']);
  });
});
