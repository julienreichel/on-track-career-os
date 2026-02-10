import { ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { logError } from '@/utils/logError';

type AuthComposable = {
  userId: { value: string | null };
  loadUserId: () => Promise<void>;
};

type UseAccountDeletionOptions = {
  auth?: AuthComposable;
  service?: UserProfileService;
};

export const useAccountDeletion = (options: UseAccountDeletionOptions = {}) => {
  const auth = options.auth ?? useAuthUser();
  const service = options.service ?? new UserProfileService();
  const deleting = ref(false);
  const error = ref<string | null>(null);

  const deleteAccount = async () => {
    deleting.value = true;
    error.value = null;

    try {
      if (!auth.userId.value) {
        await auth.loadUserId();
      }

      if (!auth.userId.value) {
        throw new Error('Missing user id');
      }

      const deleted = await service.deleteUserProfile(auth.userId.value);
      if (!deleted) {
        throw new Error('Failed to delete account');
      }

      const { $Amplify } = useNuxtApp();
      if (!$Amplify?.Auth?.signOut) {
        throw new Error('Amplify Auth is not initialized');
      }

      await $Amplify.Auth.signOut();
      await navigateTo('/');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = message;
      logError('[useAccountDeletion] Failed to delete account', err);
      return false;
    } finally {
      deleting.value = false;
    }
  };

  return {
    deleting,
    error,
    deleteAccount,
  };
};
