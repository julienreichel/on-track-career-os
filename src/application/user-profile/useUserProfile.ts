import { ref } from 'vue'
import { UserProfileService } from '@/domain/user-profile/UserProfileService'
import type { UserProfile } from '@/domain/user-profile/UserProfile';

export function useUserProfile(id: string) {
  const item = ref<UserProfile | null>(null);
  const loading = ref(false)
  const service = new UserProfileService()

  const load = async () => {
    loading.value = true
    item.value = await service.getFullUserProfile(id)
    loading.value = false
  }

  return { item, loading, load }
}
