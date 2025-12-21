import { ref } from 'vue'
import { CompanyService } from '@/domain/company/CompanyService'
import type { Company } from '@/domain/company/Company';

export function useCompany(id: string) {
  const item = ref<Company | null>(null);
  const loading = ref(false)
  const error = ref<string | null>(null)
  const service = new CompanyService()

  const load = async () => {
    loading.value = true
    error.value = null
    
    try {
      item.value = await service.getFullCompany(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('[useCompany] Error loading company:', err)
    } finally {
      loading.value = false
    }
  }

  return { item, loading, error, load }
}
