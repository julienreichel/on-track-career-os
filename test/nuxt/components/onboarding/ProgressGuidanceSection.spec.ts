import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import ProgressGuidanceSection from '@/components/onboarding/ProgressGuidanceSection.vue';

describe('ProgressGuidanceSection', () => {
  const i18n = createTestI18n();

  const mockProgress = {
    state: ref(null),
    nextAction: ref(null),
    error: ref(null),
    load: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with progress', () => {
    mockProgress.state.value = { phase: 'prepare', onboardingCompleted: true };
    mockProgress.nextAction.value = { action: 'next-step', labelKey: 'progress.actions.next' };

    const wrapper = mount(ProgressGuidanceSection, {
      props: {
        progress: mockProgress as never,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UAlert: { template: '<div class="alert"><slot /></div>' },
          ProgressBannerCard: { template: '<div class="banner-card" />' },
          ProgressChecklistCard: { template: '<div class="checklist-card" />' },
        },
      },
    });

    expect(wrapper.find('.banner-card').exists()).toBe(true);
    expect(wrapper.find('.checklist-card').exists()).toBe(true);
  });

  it('displays error when present', () => {
    mockProgress.state.value = null;
    mockProgress.error.value = 'Failed to load';

    const wrapper = mount(ProgressGuidanceSection, {
      props: {
        progress: mockProgress as never,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UAlert: { template: '<div class="alert"><slot /></div>' },
          ProgressBannerCard: { template: '<div class="banner-card" />' },
          ProgressChecklistCard: { template: '<div class="checklist-card" />' },
        },
      },
    });

    expect(wrapper.find('.alert').exists()).toBe(true);
  });

  it('does not render when phase is bonus', () => {
    mockProgress.state.value = { phase: 'bonus', onboardingCompleted: true };
    mockProgress.nextAction.value = null;

    const wrapper = mount(ProgressGuidanceSection, {
      props: {
        progress: mockProgress as never,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UAlert: { template: '<div class="alert"><slot /></div>' },
          ProgressBannerCard: { template: '<div class="banner-card" />' },
          ProgressChecklistCard: { template: '<div class="checklist-card" />' },
        },
      },
    });

    expect(wrapper.find('.banner-card').exists()).toBe(false);
  });
});
