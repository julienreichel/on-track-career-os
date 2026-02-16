import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useErrorDisplay } from '@/composables/useErrorDisplay';

const toastAdd = vi.fn();

beforeEach(() => {
  (globalThis as { useToast?: () => { add: typeof toastAdd } }).useToast = () => ({
    add: toastAdd,
  });
});

vi.mock('#app', () => ({
  useToast: () => ({
    add: toastAdd,
  }),
}));

vi.mock('#imports', () => ({
  useToast: () => ({
    add: toastAdd,
  }),
}));

describe('useErrorDisplay', () => {
  beforeEach(() => {
    toastAdd.mockClear();
  });

  it('tracks and clears page errors', () => {
    const { pageError, pageErrorMessageKey, setPageError, clearPageError } = useErrorDisplay();

    expect(pageError.value).toBeNull();
    expect(pageErrorMessageKey.value).toBeNull();
    setPageError('Load failed');
    expect(pageError.value).toBe('Load failed');
    expect(pageErrorMessageKey.value).toBeNull();
    setPageError('Load failed', 'applicationStrength.errors.loadFailed');
    expect(pageErrorMessageKey.value).toBe('applicationStrength.errors.loadFailed');
    clearPageError();
    expect(pageError.value).toBeNull();
    expect(pageErrorMessageKey.value).toBeNull();
  });

  it('notifies action errors via toast', () => {
    const { notifyActionError } = useErrorDisplay();

    notifyActionError({ title: 'Oops', description: 'Something went wrong' });

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Oops',
        description: 'Something went wrong',
        color: 'error',
      })
    );
  });

  it('allows action errors without description', () => {
    const { notifyActionError } = useErrorDisplay();

    notifyActionError({ title: 'Oops' });

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Oops',
        description: undefined,
        color: 'error',
      })
    );
  });
});
