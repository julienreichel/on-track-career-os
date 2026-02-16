import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createTestI18n } from '../../../../utils/createTestI18n';
import NewSpeechPage from '@/pages/applications/speech/new.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  }),
}));

describe('applications/speech/new page', () => {
  const i18n = createTestI18n();

  it('renders form for creating speech', () => {
    const wrapper = mount(NewSpeechPage, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div class="page"><slot /></div>' },
          UPageHeader: { template: '<div class="header" />' },
          UPageBody: { template: '<div class="body"><slot /></div>' },
          UCard: { template: '<div class="card"><slot /></div>' },
          UFormField: { template: '<div class="form-field"><slot /></div>' },
          UInput: { template: '<input class="input" />' },
          UTextarea: { template: '<textarea class="textarea" />' },
          UButton: { template: '<button><slot /></button>' },
          UAlert: { template: '<div class="alert" />' },
        },
      },
    });

    expect(wrapper.find('.page').exists()).toBe(true);
    expect(wrapper.find('.input').exists()).toBe(true);
    expect(wrapper.find('.textarea').exists()).toBe(true);
  });
});
