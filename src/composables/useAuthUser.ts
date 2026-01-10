import { ref, onMounted, computed } from 'vue';
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
    void loadUserId();
  });

  const buildOwnerId = (id: string) => `${id}::${id}`;
  const ownerId = computed(() => (userId.value ? buildOwnerId(userId.value) : null));

  const loadOwnerId = async () => {
    await loadUserId();
    return userId.value ? buildOwnerId(userId.value) : null;
  };

  const getOwnerIdOrThrow = async () => {
    if (ownerId.value) {
      return ownerId.value;
    }

    const resolved = await loadOwnerId();
    if (!resolved) {
      throw new Error('Missing owner information');
    }

    return resolved;
  };

  return {
    userId,
    loading,
    error,
    loadUserId,
    ownerId,
    loadOwnerId,
    buildOwnerId,
    getOwnerIdOrThrow,
  };
};
