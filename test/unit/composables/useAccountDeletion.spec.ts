import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useAccountDeletion } from '@/composables/useAccountDeletion';

vi.mock('@/utils/logError', () => ({
  logError: vi.fn(),
}));

describe('useAccountDeletion', () => {
  const navigateToMock = vi.fn();
  const signOutMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigateTo', navigateToMock);
    vi.stubGlobal('useNuxtApp', () => ({
      $Amplify: {
        Auth: {
          signOut: signOutMock,
        },
      },
    }));
  });

  it('deletes account, signs out, and redirects', async () => {
    const auth = {
      userId: ref('user-123'),
      loadUserId: vi.fn(),
    };
    const service = {
      deleteUserProfile: vi.fn().mockResolvedValue(true),
    };

    const { deleteAccount, error, deleting } = useAccountDeletion({
      auth,
      service: service as never,
    });

    const result = await deleteAccount();

    expect(result).toBe(true);
    expect(service.deleteUserProfile).toHaveBeenCalledWith('user-123');
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(navigateToMock).toHaveBeenCalledWith('/');
    expect(error.value).toBeNull();
    expect(deleting.value).toBe(false);
  });

  it('loads user id when missing before deleting', async () => {
    const auth = {
      userId: ref<string | null>(null),
      loadUserId: vi.fn().mockImplementation(async () => {
        auth.userId.value = 'user-456';
      }),
    };
    const service = {
      deleteUserProfile: vi.fn().mockResolvedValue(true),
    };

    const { deleteAccount } = useAccountDeletion({
      auth,
      service: service as never,
    });

    const result = await deleteAccount();

    expect(result).toBe(true);
    expect(auth.loadUserId).toHaveBeenCalledOnce();
    expect(service.deleteUserProfile).toHaveBeenCalledWith('user-456');
  });

  it('returns false when deletion fails', async () => {
    const auth = {
      userId: ref('user-123'),
      loadUserId: vi.fn(),
    };
    const service = {
      deleteUserProfile: vi.fn().mockResolvedValue(false),
    };

    const { deleteAccount, error } = useAccountDeletion({
      auth,
      service: service as never,
    });

    const result = await deleteAccount();

    expect(result).toBe(false);
    expect(signOutMock).not.toHaveBeenCalled();
    expect(navigateToMock).not.toHaveBeenCalled();
    expect(error.value).toBe('Failed to delete account');
  });
});
