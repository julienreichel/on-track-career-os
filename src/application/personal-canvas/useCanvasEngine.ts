import { ref } from 'vue';
import { PersonalCanvasService } from '@/domain/personal-canvas/PersonalCanvasService';
import { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import type {
  PersonalCanvas,
  PersonalCanvasCreateInput,
  PersonalCanvasUpdateInput,
} from '@/domain/personal-canvas/PersonalCanvas';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';

/**
 * Canvas Engine Composable
 *
 * Provides functionality for loading, saving, and regenerating Personal Canvas
 * using AI operations. This is the main interface for UI components to interact
 * with PersonalCanvas domain logic.
 */
export function useCanvasEngine() {
  const canvas = ref<PersonalCanvas | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const service = new PersonalCanvasService();
  const repository = new PersonalCanvasRepository();

  /**
   * Load PersonalCanvas by ID
   * @param id - Canvas ID to load
   */
  const loadCanvas = async (id: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      canvas.value = await service.getFullPersonalCanvas(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCanvasEngine] Error loading canvas:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Save PersonalCanvas (create or update based on existence)
   * @param canvasData - Canvas data to save (without generated fields)
   */
  const saveCanvas = async (canvasData: Omit<PersonalCanvasCreateInput, 'id'>): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      if (canvas.value?.id) {
        // Update existing canvas
        const updateInput: PersonalCanvasUpdateInput = {
          id: canvas.value.id,
          ...canvasData,
        };
        const updated = await repository.update(updateInput);
        if (updated) {
          canvas.value = updated;
        }
      } else {
        // Create new canvas
        const createInput: PersonalCanvasCreateInput = {
          ...canvasData,
        };
        const created = await repository.create(createInput);
        if (created) {
          canvas.value = created;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCanvasEngine] Error saving canvas:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Regenerate PersonalCanvas using AI operation
   * @param input - User profile, experiences, and stories for canvas generation
   * @returns Generated PersonalCanvas from AI
   */
  const regenerateCanvas = async (input: PersonalCanvasInput): Promise<PersonalCanvas | null> => {
    loading.value = true;
    error.value = null;

    try {
      const generated = await service.regenerateCanvas(input);
      canvas.value = generated;
      return generated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCanvasEngine] Error regenerating canvas:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    canvas,
    loading,
    error,
    loadCanvas,
    saveCanvas,
    regenerateCanvas,
  };
}
