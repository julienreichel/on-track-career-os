import { ref, computed, watch } from 'vue';
import { CVDocumentService, type CVBlock } from '@/domain/cvdocument/CVDocumentService';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import { useToast } from '#app';

/**
 * CV Editor Composable
 *
 * Manages local block state for CV document editing:
 * - Load CV document
 * - Add/remove/reorder blocks
 * - Update block content
 * - Auto-save changes
 * - Undo support (single-level)
 *
 * This composable provides the core editing logic for the Notion-style block editor.
 */
// eslint-disable-next-line max-lines-per-function
export function useCvEditor(cvId?: string) {
  const document = ref<CVDocument | null>(null);
  const blocks = ref<CVBlock[]>([]);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const isDirty = ref(false);
  const undoStack = ref<CVBlock[] | null>(null);

  const service = new CVDocumentService();
  const toast = useToast();

  // Computed properties
  const hasBlocks = computed(() => blocks.value.length > 0);
  const canUndo = computed(() => undoStack.value !== null);
  const totalBlocks = computed(() => blocks.value.length);

  /**
   * Load CV document and initialize blocks
   */
  const load = async (id: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      document.value = await service.getFullCVDocument(id);

      if (document.value) {
        // Extract blocks from contentJSON
        const contentJSON = document.value.contentJSON as { blocks?: CVBlock[] };
        blocks.value = contentJSON?.blocks || [];
        isDirty.value = false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'cvEditor.errors.loadFailed';
      console.error('[useCvEditor] Error loading CV:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Save current blocks to document
   */
  const save = async (): Promise<boolean> => {
    if (!document.value || !isDirty.value) {
      return false;
    }

    saving.value = true;
    error.value = null;

    try {
      const contentJSON = {
        ...(document.value.contentJSON as Record<string, unknown>),
        blocks: blocks.value,
      };

      const updated = await service.updateContent(document.value.id, contentJSON);

      if (updated) {
        document.value = updated;
        isDirty.value = false;
        toast.add({
          title: 'cvEditor.saveSuccess',
          color: 'green',
        });
        return true;
      }

      return false;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'cvEditor.errors.saveFailed';
      console.error('[useCvEditor] Error saving CV:', err);
      toast.add({
        title: 'cvEditor.errors.saveFailed',
        color: 'red',
      });
      return false;
    } finally {
      saving.value = false;
    }
  };

  /**
   * Add a new block at the end
   */
  const addBlock = (block: Omit<CVBlock, 'order'>): void => {
    const maxOrder = blocks.value.length > 0 ? Math.max(...blocks.value.map((b) => b.order)) : -1;

    blocks.value.push({
      ...block,
      order: maxOrder + 1,
    });

    isDirty.value = true;
  };

  /**
   * Add a new block at a specific position
   */
  const insertBlockAt = (index: number, block: Omit<CVBlock, 'order'>): void => {
    // Save state for undo
    undoStack.value = [...blocks.value];

    // Insert block
    blocks.value.splice(index, 0, {
      ...block,
      order: index,
    });

    // Reorder all blocks
    blocks.value = blocks.value.map((b, i) => ({ ...b, order: i }));

    isDirty.value = true;
  };

  /**
   * Remove a block by ID
   */
  const removeBlock = (blockId: string): void => {
    // Save state for undo
    undoStack.value = [...blocks.value];

    blocks.value = blocks.value.filter((b) => b.id !== blockId).map((b, i) => ({ ...b, order: i }));

    isDirty.value = true;
  };

  /**
   * Update block content
   */
  const updateBlock = (blockId: string, updates: Partial<CVBlock>): void => {
    const index = blocks.value.findIndex((b) => b.id === blockId);

    if (index === -1) {
      return;
    }

    // Save state for undo
    undoStack.value = [...blocks.value];

    blocks.value[index] = {
      ...blocks.value[index],
      ...updates,
      id: blocks.value[index].id, // Preserve ID
      order: blocks.value[index].order, // Preserve order
    };

    isDirty.value = true;
  };

  /**
   * Reorder blocks (for drag & drop)
   */
  const reorderBlocks = (newOrder: string[]): void => {
    // Save state for undo
    undoStack.value = [...blocks.value];

    // Create lookup map
    const blockMap = new Map(blocks.value.map((b) => [b.id, b]));

    // Rebuild array in new order
    blocks.value = newOrder
      .map((id) => blockMap.get(id))
      .filter((b): b is CVBlock => b !== undefined)
      .map((b, i) => ({ ...b, order: i }));

    isDirty.value = true;
  };

  /**
   * Move block up or down
   */
  const moveBlock = (blockId: string, direction: 'up' | 'down'): void => {
    const index = blocks.value.findIndex((b) => b.id === blockId);

    if (index === -1) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= blocks.value.length) {
      return;
    }

    // Save state for undo
    undoStack.value = [...blocks.value];

    // Swap blocks
    [blocks.value[index], blocks.value[newIndex]] = [blocks.value[newIndex], blocks.value[index]];

    // Update orders
    blocks.value = blocks.value.map((b, i) => ({ ...b, order: i }));

    isDirty.value = true;
  };

  /**
   * Undo last operation
   */
  const undo = (): void => {
    if (!undoStack.value) {
      return;
    }

    blocks.value = undoStack.value;
    undoStack.value = null;
    isDirty.value = true;
  };

  /**
   * Replace a specific block (for regeneration)
   */
  const replaceBlock = (blockId: string, newBlock: Omit<CVBlock, 'order'>): void => {
    const index = blocks.value.findIndex((b) => b.id === blockId);

    if (index === -1) {
      return;
    }

    // Save state for undo
    undoStack.value = [...blocks.value];

    blocks.value[index] = {
      ...newBlock,
      order: blocks.value[index].order,
    };

    isDirty.value = true;
  };

  /**
   * Discard changes and reload
   */
  const discard = async (): Promise<void> => {
    if (document.value) {
      await load(document.value.id);
    }
  };

  // Auto-save on changes (debounced)
  let saveTimeout: NodeJS.Timeout | null = null;

  watch(isDirty, (dirty) => {
    if (!dirty) return;

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout (3 seconds)
    saveTimeout = setTimeout(() => {
      save();
    }, 3000);
  });

  // Initialize if cvId provided
  if (cvId) {
    load(cvId);
  }

  return {
    // State
    document,
    blocks,
    loading,
    saving,
    error,
    isDirty,
    hasBlocks,
    canUndo,
    totalBlocks,

    // Actions
    load,
    save,
    addBlock,
    insertBlockAt,
    removeBlock,
    updateBlock,
    reorderBlocks,
    moveBlock,
    undo,
    replaceBlock,
    discard,
  };
}
