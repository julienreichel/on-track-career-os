import { ref } from 'vue'
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService'
import type { JobDescription } from '@/domain/job-description/JobDescription';

export function useJobDescription(id: string) {
  const item = ref<JobDescription | null>(null);
  const loading = ref(false)
  const error = ref<string | null>(null)
  const service = new JobDescriptionService()

  const load = async () => {
    loading.value = true
    error.value = null
    
    try {
      item.value = await service.getFullJobDescription(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('[useJobDescription] Error loading jobdescription:', err)
    } finally {
      loading.value = false
    }
  }

  return { item, loading, error, load }
}
