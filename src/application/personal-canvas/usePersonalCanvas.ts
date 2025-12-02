import { ref } from 'vue'
import { PersonalCanvasService } from '@/domain/personal-canvas/PersonalCanvasService'
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';

export function usePersonalCanvas(id: string) {
  const item = ref<PersonalCanvas | null>(null);
  const loading = ref(false)
  const error = ref<string | null>(null)
  const service = new PersonalCanvasService()

  const load = async () => {
    loading.value = true
    error.value = null
    
    try {
      item.value = await service.getFullPersonalCanvas(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('[usePersonalCanvas] Error loading personalcanvas:', err)
    } finally {
      loading.value = false
    }
  }

  return { item, loading, error, load }
}
