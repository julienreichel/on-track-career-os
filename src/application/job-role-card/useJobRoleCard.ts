import { ref } from 'vue'
import { JobRoleCardService } from '@/domain/job-role-card/JobRoleCardService'
import type { JobRoleCard } from '@/domain/job-role-card/JobRoleCard';

export function useJobRoleCard(id: string) {
  const item = ref<JobRoleCard | null>(null);
  const loading = ref(false)
  const error = ref<string | null>(null)
  const service = new JobRoleCardService()

  const load = async () => {
    loading.value = true
    error.value = null
    
    try {
      item.value = await service.getFullJobRoleCard(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('[useJobRoleCard] Error loading jobrolecard:', err)
    } finally {
      loading.value = false
    }
  }

  return { item, loading, error, load }
}
