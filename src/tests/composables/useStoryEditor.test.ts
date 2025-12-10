import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStoryEditor } from '@/composables/useStoryEditor';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';

vi.mock('@/domain/starstory/STARStoryService');

describe('useStoryEditor', () => {
  const mockStory: STARStory = {
    id: 'story-1',
    situation: 'Test situation',
    task: 'Test task',
    action: 'Test action',
    result: 'Test result',
    achievements: ['Achievement 1'],
    kpiSuggestions: ['KPI 1'],
    experienceId: 'exp-1',
    owner: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { story, formState, isDirty, loading, error } = useStoryEditor();

      expect(story.value).toBeNull();
      expect(formState.value.situation).toBe('');
      expect(isDirty.value).toBe(false);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should auto-load story when ID provided', async () => {
      vi.mocked(STARStoryService.prototype.getFullSTARStory).mockResolvedValue(mockStory);

      const { story, formState } = useStoryEditor('story-1');

      await vi.waitFor(() => expect(story.value).not.toBeNull());

      expect(story.value).toEqual(mockStory);
      expect(formState.value.situation).toBe('Test situation');
    });
  });

  describe('load', () => {
    it('should load story and populate form state', async () => {
      vi.mocked(STARStoryService.prototype.getFullSTARStory).mockResolvedValue(mockStory);

      const { load, story, formState, isDirty } = useStoryEditor();

      await load('story-1');

      expect(story.value).toEqual(mockStory);
      expect(formState.value.situation).toBe('Test situation');
      expect(formState.value.achievements).toEqual(['Achievement 1']);
      expect(isDirty.value).toBe(false);
    });

    it('should handle load errors', async () => {
      vi.mocked(STARStoryService.prototype.getFullSTARStory).mockRejectedValue(
        new Error('Load failed')
      );

      const { load, error } = useStoryEditor();

      await load('story-1');

      expect(error.value).toBe('Load failed');
    });
  });

  describe('initializeNew', () => {
    it('should initialize with empty form', () => {
      const { initializeNew, story, formState, isDirty } = useStoryEditor();

      initializeNew();

      expect(story.value).toBeNull();
      expect(formState.value.situation).toBe('');
      expect(isDirty.value).toBe(false);
    });

    it('should initialize with provided data', () => {
      const { initializeNew, formState, isDirty } = useStoryEditor();

      initializeNew({ situation: 'Pre-filled', experienceId: 'exp-1' });

      expect(formState.value.situation).toBe('Pre-filled');
      expect(formState.value.experienceId).toBe('exp-1');
      expect(isDirty.value).toBe(true);
    });
  });

  describe('updateField', () => {
    it('should update form field and mark as dirty', () => {
      const { initializeNew, updateField, formState, isDirty } = useStoryEditor();

      initializeNew();
      updateField('situation', 'New situation');

      expect(formState.value.situation).toBe('New situation');
      expect(isDirty.value).toBe(true);
    });
  });

  describe('save', () => {
    it('should validate form before saving', async () => {
      const { save, error } = useStoryEditor();

      const result = await save('exp-1');

      expect(result).toBeNull();
      expect(error.value).toBe('storyEditor.errors.invalidForm');
    });

    it('should require experience ID', async () => {
      const { initializeNew, updateField, save, error } = useStoryEditor();

      initializeNew();
      updateField('situation', 'S');
      updateField('task', 'T');
      updateField('action', 'A');
      updateField('result', 'R');

      const result = await save();

      expect(result).toBeNull();
      expect(error.value).toBe('storyEditor.errors.missingExperienceId');
    });

    it('should create new story', async () => {
      vi.mocked(STARStoryService.prototype.createAndLinkStory).mockResolvedValue(mockStory);

      const { initializeNew, updateField, save, story, isDirty } = useStoryEditor();

      initializeNew({ experienceId: 'exp-1' });
      updateField('situation', 'S');
      updateField('task', 'T');
      updateField('action', 'A');
      updateField('result', 'R');

      const result = await save();

      expect(result).toEqual(mockStory);
      expect(story.value).toEqual(mockStory);
      expect(isDirty.value).toBe(false);
    });

    it('should update existing story', async () => {
      vi.mocked(STARStoryService.prototype.getFullSTARStory).mockResolvedValue(mockStory);
      vi.mocked(STARStoryService.prototype.updateStory).mockResolvedValue({
        ...mockStory,
        situation: 'Updated',
      });

      const { load, updateField, save, story } = useStoryEditor();

      await load('story-1');
      updateField('situation', 'Updated');

      const result = await save();

      expect(result?.situation).toBe('Updated');
      expect(story.value?.situation).toBe('Updated');
    });
  });

  describe('deleteStory', () => {
    it('should not delete if no story loaded', async () => {
      const { deleteStory, error } = useStoryEditor();

      const result = await deleteStory();

      expect(result).toBe(false);
      expect(error.value).toBe('storyEditor.errors.noStoryToDelete');
    });

    it('should delete story and reset state', async () => {
      vi.mocked(STARStoryService.prototype.getFullSTARStory).mockResolvedValue(mockStory);
      vi.mocked(STARStoryService.prototype.deleteStory).mockResolvedValue(undefined);

      const { load, deleteStory, story, formState } = useStoryEditor();

      await load('story-1');
      const result = await deleteStory();

      expect(result).toBe(true);
      expect(story.value).toBeNull();
      expect(formState.value.situation).toBe('');
    });
  });

  describe('computed properties', () => {
    it('should identify new story correctly', () => {
      const { isNewStory, initializeNew } = useStoryEditor();

      initializeNew();

      expect(isNewStory.value).toBe(true);
    });

    it('should validate canSave', () => {
      const { initializeNew, updateField, canSave } = useStoryEditor();

      initializeNew();

      expect(canSave.value).toBe(false);

      updateField('situation', 'S');
      updateField('task', 'T');
      updateField('action', 'A');
      updateField('result', 'R');

      expect(canSave.value).toBe(true);
    });
  });
});
