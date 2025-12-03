import { ref } from 'vue';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

export function useCVDocument(id: string) {
  const item = ref<CVDocument | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new CVDocumentService();

  const load = async () => {
    loading.value = true;
    error.value = null;

    try {
      item.value = await service.getFullCVDocument(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCVDocument] Error loading cvdocument:', err);
    } finally {
      loading.value = false;
    }
  };

  return { item, loading, error, load };
}
