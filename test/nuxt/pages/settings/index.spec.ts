import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import SettingsPage from '@/pages/settings/index.vue';

vi.mock('@/composables/useAccountDeletion', () => ({
  useAccountDeletion: () => ({
    deleteAccount: vi.fn(),
  }),
}));

describe('settings/index page', () => {
  const i18n = createTestI18n();

  it('renders settings page', () => {
    const wrapper = mount(SettingsPage, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div class="page"><slot /></div>' },
          UPageHeader: { template: '<div class="header" />' },
          UPageBody: { template: '<div class="body"><slot /></div>' },
          UPageCard: { template: '<div class="card"><slot /></div>' },
          DeleteAccountCard: { template: '<div class="delete-card" />' },
        },
      },
    });

    expect(wrapper.find('.page').exists()).toBe(true);
    expect(wrapper.find('.delete-card').exists()).toBe(true);
  });
});
