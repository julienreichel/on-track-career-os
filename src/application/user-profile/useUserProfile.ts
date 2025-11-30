import { ref } from 'vue';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { UserProfile } from '@/domain/user-profile/UserProfile';

export function useUserProfile(id: string) {
  const item = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new UserProfileService();

  const load = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      item.value = await service.getFullUserProfile(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useUserProfile] Error loading profile:', err);
    } finally {
      loading.value = false;
    }
  };

  return { item, loading, error, load };
}
