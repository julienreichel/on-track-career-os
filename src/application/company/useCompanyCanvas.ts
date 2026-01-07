import { computed, ref } from 'vue';
import type { CompanyCanvas } from '@/domain/company-canvas/CompanyCanvas';
import { CompanyCanvasService } from '@/domain/company-canvas/CompanyCanvasService';
import {
  COMPANY_CANVAS_BLOCKS,
  type CompanyCanvasBlockKey,
} from '@/domain/company-canvas/canvasBlocks';

type BlockDraft = Record<CompanyCanvasBlockKey, string[]>;

function createEmptyDraft(): BlockDraft {
  return COMPANY_CANVAS_BLOCKS.reduce<BlockDraft>((acc, key) => {
    acc[key] = [];
    return acc;
  }, {} as BlockDraft);
}

export function useCompanyCanvas(companyId: string) {
  const canvas = ref<CompanyCanvas | null>(null);
  const draftBlocks = ref<BlockDraft>(createEmptyDraft());
  const draftSummary = ref('');
  const dirty = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new CompanyCanvasService();

  const run = async <T>(cb: () => Promise<T>): Promise<T> => {
    loading.value = true;
    error.value = null;
    try {
      return await cb();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const load = async () => {
    const result = await run(() => service.getByCompanyId(companyId));
    canvas.value = result;
    hydrateDraft(result);
    dirty.value = false;
    return result;
  };

  const hydrate = (data: CompanyCanvas | null) => {
    canvas.value = data;
    hydrateDraft(data);
    dirty.value = false;
    loading.value = false;
    error.value = null;
  };

  const updateBlock = (block: CompanyCanvasBlockKey, values: string[]) => {
    draftBlocks.value[block] = values;
    dirty.value = true;
  };

  const save = async () => {
    const payload = {
      ...draftBlocks.value,
    };
    const updated = await run(() => service.saveDraft(companyId, payload));
    canvas.value = updated;
    hydrateDraft(updated);
    dirty.value = false;
    return updated;
  };

  const regenerate = async (notes?: string[]) => {
    const regenerated = await run(() => service.regenerateCanvas(companyId, notes));
    canvas.value = regenerated;
    hydrateDraft(regenerated);
    dirty.value = false;
    return regenerated;
  };

  const isEmpty = computed(() =>
    COMPANY_CANVAS_BLOCKS.every((key) => draftBlocks.value[key].length === 0)
  );

  function hydrateDraft(data: CompanyCanvas | null) {
    if (!data) {
      draftBlocks.value = createEmptyDraft();
      draftSummary.value = '';
      return;
    }
    const next: BlockDraft = createEmptyDraft();
    COMPANY_CANVAS_BLOCKS.forEach((key) => {
      next[key] = (data[key] as string[]) ?? [];
    });
    draftBlocks.value = next;
  }

  return {
    canvas,
    draftBlocks,
    draftSummary,
    dirty,
    isEmpty,
    loading,
    error,
    load,
    hydrate,
    updateBlock,
    save,
    regenerate,
  };
}
