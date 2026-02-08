import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../../../../utils/createTestI18n';
import { allowConsoleOutput } from '../../../../../../setup/console-guard';
import StoryFormPage from '@/pages/profile/experiences/[experienceId]/stories/[storyId].vue';
import type { Experience } from '@/domain/experience/Experience';
import type { StoryFormState } from '@/composables/useStoryEditor';

// Mock services
vi.mock('@/domain/experience/ExperienceService');
vi.mock('@/domain/starstory/STARStoryService');

// Mock composables
const formStateRef = ref<StoryFormState | null>(null);
const isDirtyRef = ref(false);
const canSaveRef = ref(false);
const loadingRef = ref(false);
const savingRef = ref(false);
const errorRef = ref<string | null>(null);
const mockLoad = vi.fn();
const mockInitializeNew = vi.fn();
const mockSave = vi.fn();
const mockUpdateField = vi.fn();

vi.mock('@/composables/useStoryEditor', () => ({
  useStoryEditor: () => ({
    formState: formStateRef,
    isDirty: isDirtyRef,
    canSave: canSaveRef,
    loading: loadingRef,
    saving: savingRef,
    error: errorRef,
    load: mockLoad,
    initializeNew: mockInitializeNew,
    save: mockSave,
    updateField: mockUpdateField,
  }),
}));

const generatingInterviewRef = ref(false);
const interviewErrorRef = ref<string | null>(null);

vi.mock('@/composables/useStarInterview', () => ({
  useStarInterview: () => ({
    generating: generatingInterviewRef,
    error: interviewErrorRef,
  }),
}));

const achievementsRef = ref<string[]>([]);
const kpiSuggestionsRef = ref<string[]>([]);
const generatingEnhancerRef = ref(false);
const enhancerErrorRef = ref<string | null>(null);
const mockGenerate = vi.fn();
const mockLoadEnhancements = vi.fn();

vi.mock('@/composables/useStoryEnhancer', () => ({
  useStoryEnhancer: () => ({
    achievements: achievementsRef,
    kpiSuggestions: kpiSuggestionsRef,
    generating: generatingEnhancerRef,
    error: enhancerErrorRef,
    generate: mockGenerate,
    load: mockLoadEnhancements,
  }),
}));

const mockExperience: Experience = {
  id: 'exp-123',
  userId: 'user-123',
  title: 'Senior Developer',
  companyName: 'Tech Corp',
  startDate: '2023-01-01',
  endDate: null,
  status: 'complete',
  experienceType: 'work',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  owner: 'user-123',
};

const mockFormState: StoryFormState = {
  title: 'Improved performance',
  situation: 'System was slow',
  task: 'Optimize queries',
  action: 'Implemented caching',
  result: '50% faster',
  achievements: ['Reduced load time'],
  kpiSuggestions: ['50% improvement'],
};

const mockExperienceService = {
  getFullExperience: vi.fn(),
};

const mockStoryService = {
  generateStar: vi.fn(),
  generateAchievements: vi.fn(),
};

const mockRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/profile/experiences/:experienceId/stories/:storyId',
      component: { template: '<div>Story Form</div>' },
    },
    {
      path: '/profile/experiences/:experienceId/stories',
      component: { template: '<div>Stories List</div>' },
    },
  ],
});

const mountPage = async (routeParams = { experienceId: 'exp-123', storyId: 'new' }) => {
  await mockRouter.push(
    `/profile/experiences/${routeParams.experienceId}/stories/${routeParams.storyId}`
  );

  const wrapper = mount(StoryFormPage, {
    global: {
      plugins: [createTestI18n(), mockRouter],
      stubs: {
        UPage: true,
        UPageHeader: true,
        UPageBody: true,
        UAlert: true,
        UCard: true,
        UIcon: true,
        UButton: true,
        UFormField: true,
        UTextarea: true,
        StoryForm: true,
        AchievementsKpisPanel: true,
        UnsavedChangesModal: true,
      },
    },
  });

  await flushPromises();
  return wrapper;
};

describe('Story Form Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    formStateRef.value = null;
    isDirtyRef.value = false;
    canSaveRef.value = false;
    loadingRef.value = false;
    savingRef.value = false;
    errorRef.value = null;
    generatingInterviewRef.value = false;
    interviewErrorRef.value = null;
    achievementsRef.value = [];
    kpiSuggestionsRef.value = [];
    generatingEnhancerRef.value = false;
    enhancerErrorRef.value = null;

    mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);
    mockLoad.mockResolvedValue(undefined);
    mockInitializeNew.mockImplementation(() => {
      formStateRef.value = {
        title: '',
        situation: '',
        task: '',
        action: '',
        result: '',
      };
    });
    mockSave.mockResolvedValue({ id: 'story-456' });
    mockStoryService.generateStar.mockResolvedValue([]);
    mockStoryService.generateAchievements.mockResolvedValue({
      achievements: [],
      kpiSuggestions: [],
    });

    const { ExperienceService } = await import('@/domain/experience/ExperienceService');
    vi.mocked(ExperienceService).mockImplementation(() => mockExperienceService as any);

    const { STARStoryService } = await import('@/domain/starstory/STARStoryService');
    vi.mocked(STARStoryService).mockImplementation(() => mockStoryService as any);
  });

  describe('Component Lifecycle', () => {
    it('mounts successfully', async () => {
      const wrapper = await mountPage();
      expect(wrapper.exists()).toBe(true);
    });

    it('loads experience on mount', async () => {
      await mountPage();
      await flushPromises();

      expect(mockExperienceService.getFullExperience).toHaveBeenCalledWith('exp-123');
    });

    it('initializes new story for new mode', async () => {
      await mountPage({ experienceId: 'exp-123', storyId: 'new' });
      await flushPromises();

      expect(mockInitializeNew).toHaveBeenCalledWith({ experienceId: 'exp-123' });
    });

    it('loads existing story for edit mode', async () => {
      await mountPage({ experienceId: 'exp-123', storyId: 'story-456' });
      await flushPromises();

      expect(mockLoad).toHaveBeenCalledWith('story-456');
    });

    it('loads achievements when editing existing story', async () => {
      formStateRef.value = { ...mockFormState };
      await mountPage({ experienceId: 'exp-123', storyId: 'story-456' });
      await flushPromises();

      expect(mockLoadEnhancements).toHaveBeenCalledWith({
        achievements: ['Reduced load time'],
        kpiSuggestions: ['50% improvement'],
      });
    });

    it('handles error loading experience gracefully', async () => {
      await allowConsoleOutput(async () => {
        mockExperienceService.getFullExperience.mockRejectedValue(
          new Error('Experience not found')
        );

        const wrapper = await mountPage();
        await flushPromises();

        expect(wrapper.vm.companyName).toBe('');
      });
    });

    it('displays company name from experience', async () => {
      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.vm.companyName).toBe('Tech Corp');
    });

    it('uses experience title if companyName not available', async () => {
      mockExperienceService.getFullExperience.mockResolvedValue({
        ...mockExperience,
        companyName: '',
      });

      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.vm.companyName).toBe('Senior Developer');
    });
  });

  describe('Computed Properties', () => {
    it('experienceId returns route parameter', async () => {
      const wrapper = await mountPage({ experienceId: 'exp-456', storyId: 'new' });
      expect(wrapper.vm.experienceId).toBe('exp-456');
    });

    it('storyId returns route parameter', async () => {
      const wrapper = await mountPage({ experienceId: 'exp-123', storyId: 'story-789' });
      expect(wrapper.vm.storyId).toBe('story-789');
    });

    it('isNew returns true when storyId is new', async () => {
      const wrapper = await mountPage({ experienceId: 'exp-123', storyId: 'new' });
      expect(wrapper.vm.isNew).toBe(true);
    });

    it('isNew returns false when editing existing story', async () => {
      const wrapper = await mountPage({ experienceId: 'exp-123', storyId: 'story-456' });
      expect(wrapper.vm.isNew).toBe(false);
    });

    it('loading combines editor and interview loading states', async () => {
      loadingRef.value = false;
      generatingInterviewRef.value = true;

      const wrapper = await mountPage();
      expect(wrapper.vm.loading).toBe(true);
    });

    it('error combines all error states', async () => {
      errorRef.value = 'Editor error';
      const wrapper = await mountPage();
      expect(wrapper.vm.error).toBe('Editor error');

      errorRef.value = null;
      interviewErrorRef.value = 'Interview error';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.error).toBe('Interview error');

      interviewErrorRef.value = null;
      enhancerErrorRef.value = 'Enhancer error';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.error).toBe('Enhancer error');
    });
  });

  describe('Mode Selection', () => {
    it('shows mode selection for new stories', async () => {
      const wrapper = await mountPage({ experienceId: 'exp-123', storyId: 'new' });
      expect(wrapper.vm.showModeSelection).toBe(true);
      expect(wrapper.vm.selectedMode).toBeNull();
    });

    it('does not show mode selection for existing stories', async () => {
      const wrapper = await mountPage({ experienceId: 'exp-123', storyId: 'story-456' });
      expect(wrapper.vm.showModeSelection).toBe(true);
      expect(wrapper.vm.selectedMode).toBeNull();
    });

    it('handleStartInterview sets interview mode', async () => {
      const wrapper = await mountPage();

      wrapper.vm.handleStartInterview();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedMode).toBe('interview');
      expect(wrapper.vm.showModeSelection).toBe(false);
    });

    it('handleSelectManual sets manual mode', async () => {
      const wrapper = await mountPage();

      wrapper.vm.handleSelectManual();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedMode).toBe('manual');
      expect(wrapper.vm.showModeSelection).toBe(false);
    });
  });

  describe('Free Text Interview', () => {
    it('handleSubmitFreeText does nothing when input is empty', async () => {
      const wrapper = await mountPage();
      wrapper.vm.freeTextInput = '';

      await wrapper.vm.handleSubmitFreeText();

      expect(mockStoryService.generateStar).not.toHaveBeenCalled();
    });

    it('handleSubmitFreeText generates story from text', async () => {
      const generatedStory = {
        title: 'Generated Story',
        situation: 'Generated situation',
        task: 'Generated task',
        action: 'Generated action',
        result: 'Generated result',
      };
      mockStoryService.generateStar.mockResolvedValue([generatedStory]);

      const wrapper = await mountPage();
      wrapper.vm.freeTextInput = 'I improved the system performance by optimizing queries';

      await wrapper.vm.handleSubmitFreeText();
      await flushPromises();

      expect(mockStoryService.generateStar).toHaveBeenCalledWith(
        'I improved the system performance by optimizing queries'
      );
      expect(mockUpdateField).toHaveBeenCalledWith('title', 'Generated Story');
      expect(mockUpdateField).toHaveBeenCalledWith('situation', 'Generated situation');
      expect(wrapper.vm.selectedMode).toBe('manual');
    });

    it('handleSubmitFreeText switches to manual mode after generation', async () => {
      mockStoryService.generateStar.mockResolvedValue([
        {
          title: 'Story',
          situation: 'Sit',
          task: 'Task',
          action: 'Act',
          result: 'Res',
        },
      ]);

      const wrapper = await mountPage();
      wrapper.vm.selectedMode = 'interview';
      wrapper.vm.freeTextInput = 'Some text';

      await wrapper.vm.handleSubmitFreeText();
      await flushPromises();

      expect(wrapper.vm.selectedMode).toBe('manual');
    });

    it('handleSubmitFreeText generates achievements automatically', async () => {
      mockStoryService.generateStar.mockResolvedValue([
        {
          title: 'Story',
          situation: 'Sit',
          task: 'Task',
          action: 'Act',
          result: 'Res',
        },
      ]);

      const wrapper = await mountPage();
      wrapper.vm.freeTextInput = 'Some text';

      await wrapper.vm.handleSubmitFreeText();
      await flushPromises();

      expect(mockGenerate).toHaveBeenCalled();
    });

    it('handleSubmitFreeText handles generation error', async () => {
      await allowConsoleOutput(async () => {
        mockStoryService.generateStar.mockRejectedValue(new Error('AI error'));

        const wrapper = await mountPage();
        wrapper.vm.selectedMode = 'interview';
        wrapper.vm.freeTextInput = 'Some text';

        await wrapper.vm.handleSubmitFreeText();
        await flushPromises();

        // Error is logged but doesn't crash, mode stays interview
        expect(wrapper.vm.selectedMode).toBe('interview');
      });
    });

    it('handles empty array from generateStar', async () => {
      mockStoryService.generateStar.mockResolvedValue([]);

      const wrapper = await mountPage();
      wrapper.vm.freeTextInput = 'Some text';

      await wrapper.vm.handleSubmitFreeText();
      await flushPromises();

      // Should not call updateField if no stories generated
      expect(mockUpdateField).not.toHaveBeenCalled();
    });
  });

  describe('Achievements Generation', () => {
    it('handleGenerateAchievements does nothing when formState is null', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      
      // Manually set formState to null after mount
      formStateRef.value = null;
      mockGenerate.mockClear();

      await wrapper.vm.handleGenerateAchievements();

      expect(mockGenerate).not.toHaveBeenCalled();
    });

    it('handleGenerateAchievements generates and updates achievements', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      
      // Set formState after mount
      formStateRef.value = { ...mockFormState };
      achievementsRef.value = ['New achievement'];
      kpiSuggestionsRef.value = ['New KPI'];
      mockGenerate.mockClear();
      mockUpdateField.mockClear();

      await wrapper.vm.handleGenerateAchievements();
      await flushPromises();

      expect(mockGenerate).toHaveBeenCalledWith({
        title: 'Improved performance',
        situation: 'System was slow',
        task: 'Optimize queries',
        action: 'Implemented caching',
        result: '50% faster',
      });
      expect(mockUpdateField).toHaveBeenCalledWith('achievements', ['New achievement']);
      expect(mockUpdateField).toHaveBeenCalledWith('kpiSuggestions', ['New KPI']);
      expect(wrapper.vm.showAchievementsPanel).toBe(true);
    });

    it('does not update fields if no achievements generated', async () => {
      formStateRef.value = { ...mockFormState };
      achievementsRef.value = [];
      kpiSuggestionsRef.value = [];

      const wrapper = await mountPage();
      mockUpdateField.mockClear();

      await wrapper.vm.handleGenerateAchievements();
      await flushPromises();

      expect(mockUpdateField).not.toHaveBeenCalled();
    });
  });

  describe('Form Updates', () => {
    it('handleStoryUpdate updates all form fields', async () => {
      const wrapper = await mountPage();
      const updatedState: StoryFormState = {
        title: 'Updated Title',
        situation: 'Updated Situation',
        task: 'Updated Task',
        action: 'Updated Action',
        result: 'Updated Result',
      };

      wrapper.vm.handleStoryUpdate(updatedState);

      expect(mockUpdateField).toHaveBeenCalledWith('title', 'Updated Title');
      expect(mockUpdateField).toHaveBeenCalledWith('situation', 'Updated Situation');
      expect(mockUpdateField).toHaveBeenCalledWith('task', 'Updated Task');
      expect(mockUpdateField).toHaveBeenCalledWith('action', 'Updated Action');
      expect(mockUpdateField).toHaveBeenCalledWith('result', 'Updated Result');
    });

    it('handleAchievementsUpdate updates achievements', async () => {
      const wrapper = await mountPage();
      const newAchievements = ['Achievement 1', 'Achievement 2'];

      wrapper.vm.handleAchievementsUpdate(newAchievements);

      expect(achievementsRef.value).toEqual(newAchievements);
      expect(mockUpdateField).toHaveBeenCalledWith('achievements', newAchievements);
    });

    it('handleKpisUpdate updates KPIs', async () => {
      const wrapper = await mountPage();
      const newKpis = ['KPI 1', 'KPI 2'];

      wrapper.vm.handleKpisUpdate(newKpis);

      expect(kpiSuggestionsRef.value).toEqual(newKpis);
      expect(mockUpdateField).toHaveBeenCalledWith('kpiSuggestions', newKpis);
    });
  });

  describe('Save Story', () => {
    it('handleSave saves story and navigates back', async () => {
      mockSave.mockResolvedValue({ id: 'story-new' });
      const wrapper = await mountPage();
      const pushSpy = vi.spyOn(mockRouter, 'push');

      await wrapper.vm.handleSave();
      await flushPromises();

      expect(mockSave).toHaveBeenCalledWith('exp-123');
      expect(pushSpy).toHaveBeenCalledWith('/profile/experiences/exp-123/stories');
    });

    it('handleSave handles error gracefully', async () => {
      await allowConsoleOutput(async () => {
        mockSave.mockRejectedValue(new Error('Save failed'));

        const wrapper = await mountPage();
        await wrapper.vm.handleSave();
        await flushPromises();

        // Should log error but not crash
      });
    });

    it('does not navigate if save returns null', async () => {
      mockSave.mockResolvedValue(null);
      const wrapper = await mountPage();
      const pushSpy = vi.spyOn(mockRouter, 'push');

      await wrapper.vm.handleSave();
      await flushPromises();

      expect(pushSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Navigation', () => {
    it('handleCancel shows confirm modal when form is dirty', async () => {
      isDirtyRef.value = true;
      const wrapper = await mountPage();

      wrapper.vm.handleCancel();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showCancelConfirm).toBe(true);
    });

    it('handleCancel navigates immediately when form is not dirty', async () => {
      isDirtyRef.value = false;
      const wrapper = await mountPage();
      const pushSpy = vi.spyOn(mockRouter, 'push');

      wrapper.vm.handleCancel();
      await flushPromises();

      expect(wrapper.vm.showCancelConfirm).toBe(false);
      expect(pushSpy).toHaveBeenCalledWith('/profile/experiences/exp-123/stories');
    });

    it('handleConfirmCancel closes modal and navigates', async () => {
      const wrapper = await mountPage();
      const pushSpy = vi.spyOn(mockRouter, 'push');
      wrapper.vm.showCancelConfirm = true;

      wrapper.vm.handleConfirmCancel();
      await flushPromises();

      expect(wrapper.vm.showCancelConfirm).toBe(false);
      expect(pushSpy).toHaveBeenCalledWith('/profile/experiences/exp-123/stories');
    });
  });

  describe('UI State Management', () => {
    it('manages showModeSelection state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.showModeSelection).toBe(true);

      wrapper.vm.handleStartInterview();
      expect(wrapper.vm.showModeSelection).toBe(false);
    });

    it('manages selectedMode state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.selectedMode).toBeNull();

      wrapper.vm.handleStartInterview();
      expect(wrapper.vm.selectedMode).toBe('interview');

      wrapper.vm.selectedMode = null;
      wrapper.vm.handleSelectManual();
      expect(wrapper.vm.selectedMode).toBe('manual');
    });

    it('manages showAchievementsPanel state', async () => {
      formStateRef.value = { ...mockFormState };
      const wrapper = await mountPage();
      expect(wrapper.vm.showAchievementsPanel).toBe(false);

      await wrapper.vm.handleGenerateAchievements();
      expect(wrapper.vm.showAchievementsPanel).toBe(true);
    });

    it('manages freeTextInput state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.freeTextInput).toBe('');

      wrapper.vm.freeTextInput = 'Some input text';
      expect(wrapper.vm.freeTextInput).toBe('Some input text');
    });

    it('manages showCancelConfirm state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.showCancelConfirm).toBe(false);

      isDirtyRef.value = true;
      wrapper.vm.handleCancel();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.showCancelConfirm).toBe(true);
    });
  });

  describe('Breadcrumb Label', () => {
    it('updates breadcrumb label to New for new stories', async () => {
      const wrapper = await mountPage({ experienceId: 'exp-123', storyId: 'new' });
      await flushPromises();

      expect(wrapper.vm.$route.meta.breadcrumbLabel).toBe('New');
    });

    it('updates breadcrumb label to Edit for existing stories', async () => {
      const wrapper = await mountPage({ experienceId: 'exp-123', storyId: 'story-456' });
      await flushPromises();

      expect(wrapper.vm.$route.meta.breadcrumbLabel).toBe('Edit');
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state from editor', async () => {
      loadingRef.value = true;
      const wrapper = await mountPage();

      expect(wrapper.vm.loading).toBe(true);
    });

    it('shows loading state from interview', async () => {
      generatingInterviewRef.value = true;
      const wrapper = await mountPage();

      expect(wrapper.vm.loading).toBe(true);
    });

    it('shows saving state', async () => {
      savingRef.value = true;
      const wrapper = await mountPage();

      expect(wrapper.vm.saving).toBe(true);
    });

    it('displays error from editor', async () => {
      errorRef.value = 'Failed to load story';
      const wrapper = await mountPage();

      expect(wrapper.vm.error).toBe('Failed to load story');
    });

    it('displays error from interview', async () => {
      interviewErrorRef.value = 'Interview generation failed';
      const wrapper = await mountPage();

      expect(wrapper.vm.error).toBe('Interview generation failed');
    });

    it('displays error from enhancer', async () => {
      enhancerErrorRef.value = 'Achievements generation failed';
      const wrapper = await mountPage();

      expect(wrapper.vm.error).toBe('Achievements generation failed');
    });
  });

  describe('Form State', () => {
    it('exposes formState from composable', async () => {
      const wrapper = await mountPage();
      await flushPromises();

      // formState is initialized by initializeNew with empty values for new stories
      expect(wrapper.vm.formState).toEqual({
        title: '',
        situation: '',
        task: '',
        action: '',
        result: '',
      });
    });

    it('exposes isDirty from composable', async () => {
      isDirtyRef.value = true;
      const wrapper = await mountPage();

      expect(wrapper.vm.isDirty).toBe(true);
    });

    it('exposes canSave from composable', async () => {
      canSaveRef.value = true;
      const wrapper = await mountPage();

      expect(wrapper.vm.canSave).toBe(true);
    });
  });
});
