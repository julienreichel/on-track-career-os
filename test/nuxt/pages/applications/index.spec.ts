import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import ApplicationsIndexPage from '@/pages/applications/index.vue';

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/applications', name: 'applications', component: ApplicationsIndexPage }],
});

const stubs = {
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template: `
      <header class="u-page-header">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <div class="links" v-if="links">
          <button v-for="(link, idx) in links" :key="idx" type="button">
            {{ link.label }}
          </button>
        </div>
      </header>
    `,
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UCard: { template: '<div class="u-card"><slot /></div>' },
  UPageGrid: { template: '<div class="u-page-grid"><slot /></div>' },
  UPageCard: {
    props: ['title', 'description'],
    template: '<div class="u-page-card"><h3>{{ title }}</h3><p>{{ description }}</p></div>',
  },
};

async function mountPage() {
  await router.push('/applications');
  await router.isReady();
  return mount(ApplicationsIndexPage, {
    global: {
      plugins: [i18n, router],
      stubs,
    },
  });
}

describe('Applications index page', () => {
  it('renders page header content', async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain(i18n.global.t('applications.page.title'));
    expect(wrapper.text()).toContain(i18n.global.t('applications.page.description'));
  });

  it('renders CV, cover letter, and speech cards', async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain(i18n.global.t('applications.cvs.page.title'));
    expect(wrapper.text()).toContain(i18n.global.t('applications.coverLetters.page.title'));
    expect(wrapper.text()).toContain(i18n.global.t('applications.speeches.page.title'));
  });

  it('renders back to home link', async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain(i18n.global.t('navigation.backToHome'));
  });
});
