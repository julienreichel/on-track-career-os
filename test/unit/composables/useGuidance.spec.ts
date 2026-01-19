import { describe, it, expect, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { useGuidance } from '@/composables/useGuidance';

const mockGetGuidance = vi.fn();
const mockLoad = vi.fn();

vi.mock('@/domain/onboarding', () => ({
  getGuidance: (...args: unknown[]) => mockGetGuidance(...args),
}));

vi.mock('@/composables/useUserProgress', () => ({
  useUserProgress: () => ({
    state: ref({ phase: 'phase1' }),
    loading: ref(false),
    error: ref(null),
    load: mockLoad,
  }),
}));

describe('useGuidance', () => {
  it('passes state and context to guidance resolver', () => {
    const context = ref({ jobsCount: 2 });
    mockGetGuidance.mockReturnValue({ banner: { titleKey: 'title', descriptionKey: 'desc' } });

    const { guidance } = useGuidance('jobs', () => context.value);
    void guidance.value;

    expect(mockGetGuidance).toHaveBeenCalledWith(
      'jobs',
      { phase: 'phase1' },
      { jobsCount: 2 }
    );
  });

  it('reacts to context changes', async () => {
    const context = ref({ jobsCount: 1 });
    mockGetGuidance.mockReturnValue({});

    const { guidance } = useGuidance('jobs', () => context.value);
    void guidance.value;
    context.value = { jobsCount: 3 };
    await nextTick();
    void guidance.value;

    expect(mockGetGuidance).toHaveBeenLastCalledWith(
      'jobs',
      { phase: 'phase1' },
      { jobsCount: 3 }
    );
  });
});
