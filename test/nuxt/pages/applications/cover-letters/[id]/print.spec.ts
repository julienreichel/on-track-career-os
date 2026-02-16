import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createTestI18n } from '../../../../../utils/createTestI18n';
import PrintPage from '@/pages/applications/cover-letters/[id]/print.vue';
import { useCoverLetter } from '@/application/cover-letter/useCoverLetter';

vi.mock('@/application/cover-letter/useCoverLetter');
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: 'letter-1' },
  }),
  useRouter: () => ({
    push: vi.fn(),
    go: vi.fn(),
  }),
}));

describe('applications/cover-letters/[id]/print page', () => {
  const i18n = createTestI18n();

  const mockCoverLetter = {
    item: ref(null),
    loading: ref(false),
    error: ref(null),
    load: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCoverLetter).mockReturnValue(mockCoverLetter as never);
  });

  it('shows loading state', () => {
    mockCoverLetter.loading.value = true;
    mockCoverLetter.item.value = null;

    const wrapper = mount(PrintPage, {
      global: {
        plugins: [i18n],
        stubs: {
          UIcon: { template: '<div class="icon" />' },
          UButton: { template: '<button><slot /></button>' },
          MarkdownContent: { template: '<div class="markdown" />' },
        },
      },
    });

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows error state', () => {
    mockCoverLetter.loading.value = false;
    mockCoverLetter.item.value = null;
    mockCoverLetter.error.value = 'Failed to load';

    const wrapper = mount(PrintPage, {
      global: {
        plugins: [i18n],
        stubs: {
          UIcon: { template: '<div class="icon" />' },
          UButton: { template: '<button><slot /></button>' },
          MarkdownContent: { template: '<div class="markdown" />' },
        },
      },
    });

    expect(wrapper.text()).toContain('Failed to load');
  });

  it('renders cover letter content', () => {
    mockCoverLetter.loading.value = false;
    mockCoverLetter.error.value = null;
    mockCoverLetter.item.value = {
      id: 'letter-1',
      content: '# Cover Letter\n\nContent here',
    };

    const wrapper = mount(PrintPage, {
      global: {
        plugins: [i18n],
        stubs: {
          UIcon: { template: '<div class="icon" />' },
          UButton: { template: '<button><slot /></button>' },
          MarkdownContent: { template: '<div class="markdown-content"><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('.markdown-content').exists()).toBe(true);
  });
});
