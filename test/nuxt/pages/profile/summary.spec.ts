import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';

const i18n = createTestI18n();

const stubs = {
  UPage: {
    template: '<div class="u-page"><slot /></div>',
  },
  UPageHeader: {
    template: `
      <header class="u-header">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <slot name="links" />
      </header>
    `,
    props: ['title', 'description', 'links'],
  },
  UPageBody: {
    template: '<section class="u-body"><slot /></section>',
  },
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UButton: {
    template: '<button class="u-button"><slot /></button>',
  },
};

describe('Profile summary header', () => {
  it('renders header title and description', () => {
    const wrapper = mount(
      {
        template: `
          <UPage>
            <UPageHeader :title="t('profile.title')" :description="t('profile.description')" />
            <UPageBody />
          </UPage>
        `,
        setup() {
          const { t } = i18n.global;
          return { t };
        },
      },
      {
        global: {
          plugins: [i18n],
          stubs,
        },
      }
    );

    expect(wrapper.text()).toContain(i18n.global.t('profile.title'));
    expect(wrapper.text()).toContain(i18n.global.t('profile.description'));
  });

  it('renders CTA for full profile', () => {
    const wrapper = mount(
      {
        template: `
          <UCard>
            <template #header>
              <div>
                <h3>{{ t('profile.summary.viewFullProfile') }}</h3>
                <p>{{ t('profile.summary.fullProfileDescription') }}</p>
              </div>
              <UButton>{{ t('profile.summary.editFromSummary') }}</UButton>
            </template>
          </UCard>
        `,
        setup() {
          const { t } = i18n.global;
          return { t };
        },
      },
      {
        global: {
          plugins: [i18n],
          stubs,
        },
      }
    );

    expect(wrapper.text()).toContain(i18n.global.t('profile.summary.viewFullProfile'));
    expect(wrapper.text()).toContain(i18n.global.t('profile.summary.editFromSummary'));
  });
});
