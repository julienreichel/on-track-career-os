import { ref, onMounted } from 'vue';
import { fetchUserAttributes } from 'aws-amplify/auth';

/**
 * Composable to get the current authenticated user's ID
 * Returns the user's Cognito sub (user ID) from their attributes
 */
export const useAuthUser = () => {
  const userId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadUserId = async () => {
    loading.value = true;
    error.value = null;

    try {
      const userAttributes = await fetchUserAttributes();
      userId.value = userAttributes.sub || null;
    } catch (err) {
      console.error('Failed to fetch user attributes:', err);
      error.value = 'Failed to load user information';
      userId.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Auto-load on mount
  onMounted(() => {
    loadUserId();
  });

  return {
    userId,
    loading,
    error,
    loadUserId,
  };
};
