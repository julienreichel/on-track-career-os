import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvTemplateCard from '@/components/cv/CvTemplateCard.vue';

const i18n = createTestI18n();

const stubs = {
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  UButton: {
    props: ['label', 'icon', 'ariaLabel'],
    emits: ['click'],
    template:
      '<button type="button" :aria-label="ariaLabel" @click="$emit(\'click\')">{{ icon }}{{ label }}</button>',
  },
  UIcon: { template: '<span class="u-icon"></span>' },
  ItemCard: {
    props: ['title', 'subtitle', 'showDelete'],
    emits: ['delete'],
    template: `
      <div class="item-card">
        <h3>{{ title }}</h3>
        <p>{{ subtitle }}</p>
        <slot />
        <slot name="badges" />
        <slot name="actions" />
        <button
          v-if="showDelete !== false"
          type="button"
          aria-label="Delete"
          @click="$emit('delete')"
        ></button>
      </div>
    `,
  },
};

describe('CvTemplateCard', () => {
  it('renders metadata and badges', () => {
    const wrapper = mount(CvTemplateCard, {
      props: {
        name: 'Classic Template',
        description: 'Clean layout',
        updatedAt: 'Jan 12, 2025',
        source: 'system:classic',
        isDefault: true,
        primaryActionLabel: 'Edit',
        primaryActionIcon: 'i-heroicons-pencil',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Classic Template');
    expect(wrapper.text()).toContain('Clean layout');
    expect(wrapper.text()).toContain(i18n.global.t('cvTemplates.labels.default'));
    expect(wrapper.text()).toContain(i18n.global.t('cvTemplates.labels.updated'));
  });

  it('emits actions from buttons', async () => {
    const wrapper = mount(CvTemplateCard, {
      props: {
        name: 'My Template',
        primaryActionLabel: 'Edit template',
        primaryActionIcon: 'i-heroicons-pencil',
        secondaryActionLabel: 'Set as default',
        secondaryActionIcon: 'i-heroicons-document-duplicate',
        showDelete: true,
        deleteIcon: 'i-heroicons-trash',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    const findButton = (label: string) => buttons.find((button) => button.text() === label);
    const findButtonByAria = (label: string) =>
      buttons.find((button) => button.attributes('aria-label') === label);

    await findButton('Edit template')?.trigger('click');
    await findButton('Set as default')?.trigger('click');
    await findButtonByAria(i18n.global.t('common.delete'))?.trigger('click');

    expect(wrapper.emitted('primary')).toBeTruthy();
    expect(wrapper.emitted('secondary')).toBeTruthy();
    expect(wrapper.emitted('delete')).toBeTruthy();
  });
});
