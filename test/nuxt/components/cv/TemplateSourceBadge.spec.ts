import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import TemplateSourceBadge from '@/components/cv/TemplateSourceBadge.vue';

const i18n = createTestI18n();

const stubs = {
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
};

describe('TemplateSourceBadge', () => {
  it('renders system label when source is system-derived', () => {
    const wrapper = mount(TemplateSourceBadge, {
      props: {
        source: 'system:classic',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('cvTemplates.source.system'));
  });

  it('renders user label when source is user', () => {
    const wrapper = mount(TemplateSourceBadge, {
      props: {
        source: 'user',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('cvTemplates.source.user'));
  });
});
