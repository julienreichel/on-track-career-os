import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvTemplateCard from '@/components/cv/CvTemplateCard.vue';

const i18n = createTestI18n();

const stubs = {
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
  ItemCard: {
    props: ['title', 'subtitle'],
    template:
      '<div class="item-card"><h3>{{ title }}</h3><p>{{ subtitle }}</p><slot /><slot name="badges" /><slot name="actions" /></div>',
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
        primaryActionLabel: 'Edit template',
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
        secondaryActionLabel: 'Set as default',
        showDelete: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    const findButton = (label: string) => buttons.find((button) => button.text() === label);

    await findButton('Edit template')?.trigger('click');
    await findButton('Set as default')?.trigger('click');
    await findButton(i18n.global.t('common.delete'))?.trigger('click');

    expect(wrapper.emitted('primary')).toBeTruthy();
    expect(wrapper.emitted('secondary')).toBeTruthy();
    expect(wrapper.emitted('delete')).toBeTruthy();
  });
});
