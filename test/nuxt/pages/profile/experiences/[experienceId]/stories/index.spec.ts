import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../../../../utils/createTestI18n';
import { allowConsoleOutput } from '../../../../../../setup/console-guard';
import StoriesIndexPage from '@/pages/profile/experiences/[experienceId]/stories/index.vue';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';

// Mock services
vi.mock('@/domain/experience/ExperienceService');
vi.mock('@/domain/starstory/STARStoryService');

// Mock composables
const storiesRef = ref<STARStory[]>([]);
const loadingRef = ref(false);
const errorRef = ref<string | null>(null);
const mockLoadByExperienceId = vi.fn();
const mockLoadForExperience = vi.fn();
const mockDeleteStory = vi.fn();

vi.mock('@/composables/useStoryList', () => ({
  useStoryList: () => ({
    stories: storiesRef,
    loading: loadingRef,
    error: errorRef,
    loadByExperienceId: mockLoadByExperienceId,
    loadForExperience: mockLoadForExperience,
    deleteStory: mockDeleteStory,
  }),
}));

const mockExperience: Experience = {
  id: 'exp-123',
  userId: 'user-123',
  title: 'Software Engineer',
  companyName: 'Tech Corp',
  startDate: '2023-01-01',
  endDate: '2024-01-01',
  responsibilities: ['Lead development', 'Code reviews'],
  tasks: ['Built features', 'Fixed bugs'],
  status: 'complete',
  experienceType: 'work',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  owner: 'user-123',
};

const mockStory: STARStory = {
  id: 'story-123',
  userId: 'user-123',
  experienceId: 'exp-123',
  title: 'Improved performance',
  situation: 'System was slow',
  task: 'Make it faster',
  action: 'Optimized queries',
  result: '50% faster',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  owner: 'user-123',
};

const mockExperienceService = {
  getFullExperience: vi.fn(),
};

const mockStoryService = {
  generateStar: vi.fn(),
  generateAchievements: vi.fn(),
  createAndLinkStory: vi.fn(),
};

const mockRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/profile/experiences/:experienceId/stories',
      component: { template: '<div>Stories List</div>' },
    },
    {
      path: '/profile/experiences/:experienceId/stories/new',
      component: { template: '<div>New Story</div>' },
    },
  ],
});

const mountPage = async (routeParams = { experienceId: 'exp-123' }) => {
  await mockRouter.push(`/profile/experiences/${routeParams.experienceId}/stories`);

  const wrapper = mount(StoriesIndexPage, {
    global: {
      plugins: [createTestI18n(), mockRouter],
      stubs: {
        UPage: true,
        UPageHeader: true,
        UPageBody: true,
        UAlert: true,
        UEmpty: true,
        UButton: true,
        ListSkeletonCards: true,
        StoryList: true,
      },
    },
  });

  await flushPromises();
  return wrapper;
};

describe('Stories Index Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    storiesRef.value = [];
    loadingRef.value = false;
    errorRef.value = null;

    mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);
    mockLoadForExperience.mockResolvedValue(undefined);
    mockLoadByExperienceId.mockResolvedValue(undefined);
    mockDeleteStory.mockResolvedValue(undefined);
    mockStoryService.generateStar.mockResolvedValue([]);
    mockStoryService.generateAchievements.mockResolvedValue({
      achievements: [],
      kpiSuggestions: [],
    });
    mockStoryService.createAndLinkStory.mockResolvedValue(mockStory);

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

    it('loads experience and stories on mount', async () => {
      await mountPage();
      await flushPromises();

      expect(mockExperienceService.getFullExperience).toHaveBeenCalledWith('exp-123');
      expect(mockLoadForExperience).toHaveBeenCalledWith(mockExperience);
    });

    it('falls back to loadByExperienceId if experience fetch fails', async () => {
      await allowConsoleOutput(async () => {
        mockExperienceService.getFullExperience.mockRejectedValue(
          new Error('Experience not found')
        );

        await mountPage();
        await flushPromises();

        expect(mockLoadByExperienceId).toHaveBeenCalledWith('exp-123');
      });
    });

    it('displays company name from experience', async () => {
      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.vm.companyName).toBe('Tech Corp');
    });

    it('uses experience title if companyName is not available', async () => {
      mockExperienceService.getFullExperience.mockResolvedValue({
        ...mockExperience,
        companyName: '',
      });

      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.vm.companyName).toBe('Software Engineer');
    });
  });

  describe('Computed Properties', () => {
    it('experienceId returns route parameter', async () => {
      const wrapper = await mountPage({ experienceId: 'exp-456' });
      expect(wrapper.vm.experienceId).toBe('exp-456');
    });
  });

  describe('Loading States', () => {
    it('shows loading state initially', async () => {
      loadingRef.value = true;
      const wrapper = await mountPage();

      expect(wrapper.vm.loading).toBe(true);
    });

    it('sets hasLoaded to true after mount completes', async () => {
      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.vm.hasLoaded).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('displays error from composable', async () => {
      errorRef.value = 'Failed to load stories';
      const wrapper = await mountPage();

      expect(wrapper.vm.error).toBe('Failed to load stories');
    });

    it('displays generation error', async () => {
      const wrapper = await mountPage();
      wrapper.vm.generationError = 'AI generation failed';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.generationError).toBe('AI generation failed');
    });
  });

  describe('Story List Display', () => {
    it('shows empty state when no stories exist', async () => {
      storiesRef.value = [];
      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.vm.stories).toHaveLength(0);
    });

    it('displays stories list when stories exist', async () => {
      storiesRef.value = [mockStory];
      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.vm.stories).toHaveLength(1);
      expect(wrapper.vm.stories[0]).toEqual(mockStory);
    });
  });

  describe('Navigation', () => {
    it('handleNewStory navigates to new story page', async () => {
      const wrapper = await mountPage();
      const pushSpy = vi.spyOn(mockRouter, 'push');

      await wrapper.vm.handleNewStory();

      expect(pushSpy).toHaveBeenCalledWith('/profile/experiences/exp-123/stories/new');
    });
  });

  describe('Delete Story', () => {
    it('handleDelete calls deleteStory', async () => {
      const wrapper = await mountPage();

      await wrapper.vm.handleDelete(mockStory);
      await flushPromises();

      expect(mockDeleteStory).toHaveBeenCalledWith('story-123');
      expect(wrapper.vm.deleting).toBe(false);
    });

    it('handleDelete handles errors gracefully', async () => {
      await allowConsoleOutput(async () => {
        mockDeleteStory.mockRejectedValue(new Error('Delete failed'));

        const wrapper = await mountPage();
        await wrapper.vm.handleDelete(mockStory);
        await flushPromises();

        expect(wrapper.vm.deleting).toBe(false);
      });
    });

    it('sets deleting state during delete operation', async () => {
      const wrapper = await mountPage();

      const deletePromise = wrapper.vm.handleDelete(mockStory);
      expect(wrapper.vm.deleting).toBe(true);

      await deletePromise;
      await flushPromises();
      expect(wrapper.vm.deleting).toBe(false);
    });
  });

  describe('Refresh Stories', () => {
    it('handleRefresh uses cached experience', async () => {
      const wrapper = await mountPage();
      await flushPromises();

      mockLoadForExperience.mockClear();
      await wrapper.vm.handleRefresh();

      expect(mockLoadForExperience).toHaveBeenCalledWith(mockExperience);
    });

    it('handleRefresh falls back to loadByExperienceId if no cached experience', async () => {
      const wrapper = await mountPage();
      await flushPromises();

      wrapper.vm.currentExperience = null;
      mockLoadByExperienceId.mockClear();

      await wrapper.vm.handleRefresh();

      expect(mockLoadByExperienceId).toHaveBeenCalledWith('exp-123');
    });
  });

  describe('Format Experience As Text', () => {
    it('formats experience with all fields', async () => {
      const wrapper = await mountPage();
      const formatted = wrapper.vm.formatExperienceAsText(mockExperience);

      expect(formatted).toContain('Job Title: Software Engineer');
      expect(formatted).toContain('Company: Tech Corp');
      expect(formatted).toContain('Duration:');
      expect(formatted).toContain('Responsibilities:');
      expect(formatted).toContain('- Lead development');
      expect(formatted).toContain('- Code reviews');
      expect(formatted).toContain('Tasks & Achievements:');
      expect(formatted).toContain('- Built features');
      expect(formatted).toContain('- Fixed bugs');
    });

    it('formats experience without company name', async () => {
      const experienceWithoutCompany = { ...mockExperience, companyName: '' };
      const wrapper = await mountPage();
      const formatted = wrapper.vm.formatExperienceAsText(experienceWithoutCompany);

      expect(formatted).not.toContain('Company:');
      expect(formatted).toContain('Job Title: Software Engineer');
    });

    it('formats experience with ongoing employment', async () => {
      const ongoingExperience = { ...mockExperience, endDate: null };
      const wrapper = await mountPage();
      const formatted = wrapper.vm.formatExperienceAsText(ongoingExperience);

      expect(formatted).toContain('Present');
    });

    it('formats experience without responsibilities', async () => {
      const experienceNoResp = { ...mockExperience, responsibilities: [] };
      const wrapper = await mountPage();
      const formatted = wrapper.vm.formatExperienceAsText(experienceNoResp);

      expect(formatted).not.toContain('Responsibilities:');
    });

    it('formats experience without tasks', async () => {
      const experienceNoTasks = { ...mockExperience, tasks: [] };
      const wrapper = await mountPage();
      const formatted = wrapper.vm.formatExperienceAsText(experienceNoTasks);

      expect(formatted).not.toContain('Tasks & Achievements:');
    });
  });

  describe('Auto-Generate Stories', () => {
    it('handleAutoGenerate generates and saves stories', async () => {
      const generatedStories = [
        {
          title: 'Generated Story 1',
          situation: 'Situation 1',
          task: 'Task 1',
          action: 'Action 1',
          result: 'Result 1',
        },
        {
          title: 'Generated Story 2',
          situation: 'Situation 2',
          task: 'Task 2',
          action: 'Action 2',
          result: 'Result 2',
        },
      ];

      mockStoryService.generateStar.mockResolvedValue(generatedStories);
      mockStoryService.generateAchievements.mockResolvedValue({
        achievements: ['Achievement 1'],
        kpiSuggestions: ['KPI 1'],
      });

      const wrapper = await mountPage();
      await flushPromises();

      await wrapper.vm.handleAutoGenerate();
      await flushPromises();

      expect(mockExperienceService.getFullExperience).toHaveBeenCalled();
      expect(mockStoryService.generateStar).toHaveBeenCalled();
      expect(mockStoryService.generateAchievements).toHaveBeenCalledTimes(2);
      expect(mockStoryService.createAndLinkStory).toHaveBeenCalledTimes(2);
      expect(mockLoadForExperience).toHaveBeenCalledWith(mockExperience);
    });

    it('sets isGenerating during generation', async () => {
      const wrapper = await mountPage();

      const generatePromise = wrapper.vm.handleAutoGenerate();
      expect(wrapper.vm.isGenerating).toBe(true);

      await generatePromise;
      await flushPromises();
      expect(wrapper.vm.isGenerating).toBe(false);
    });

    it('handles experience not found error', async () => {
      await allowConsoleOutput(async () => {
        mockExperienceService.getFullExperience.mockResolvedValue(null);

        const wrapper = await mountPage();
        await flushPromises();

        await wrapper.vm.handleAutoGenerate();
        await flushPromises();

        expect(wrapper.vm.generationError).toContain('Experience not found');
        expect(wrapper.vm.isGenerating).toBe(false);
      });
    });

    it('handles generation error gracefully', async () => {
      await allowConsoleOutput(async () => {
        mockStoryService.generateStar.mockRejectedValue(new Error('AI service unavailable'));

        const wrapper = await mountPage();
        await flushPromises();

        await wrapper.vm.handleAutoGenerate();
        await flushPromises();

        expect(wrapper.vm.generationError).toBe('AI service unavailable');
        expect(wrapper.vm.isGenerating).toBe(false);
      });
    });

    it('continues saving story even if achievements generation fails', async () => {
      await allowConsoleOutput(async () => {
        const generatedStories = [
          {
            title: 'Story without achievements',
            situation: 'Situation',
            task: 'Task',
            action: 'Action',
            result: 'Result',
          },
        ];

        mockStoryService.generateStar.mockResolvedValue(generatedStories);
        mockStoryService.generateAchievements.mockRejectedValue(new Error('Achievements failed'));

        const wrapper = await mountPage();
        await flushPromises();

        await wrapper.vm.handleAutoGenerate();
        await flushPromises();

        expect(mockStoryService.createAndLinkStory).toHaveBeenCalledWith(
          {
            title: 'Story without achievements',
            situation: 'Situation',
            task: 'Task',
            action: 'Action',
            result: 'Result',
          },
          'exp-123',
          {
            achievements: [],
            kpiSuggestions: [],
          }
        );
      });
    });

    it('generates achievements for each story', async () => {
      const generatedStories = [
        {
          title: 'Story 1',
          situation: 'Sit 1',
          task: 'Task 1',
          action: 'Act 1',
          result: 'Res 1',
        },
      ];

      mockStoryService.generateStar.mockResolvedValue(generatedStories);
      mockStoryService.generateAchievements.mockResolvedValue({
        achievements: ['Saved 30% cost'],
        kpiSuggestions: ['$50k saved'],
      });

      const wrapper = await mountPage();
      await flushPromises();

      await wrapper.vm.handleAutoGenerate();
      await flushPromises();

      expect(mockStoryService.createAndLinkStory).toHaveBeenCalledWith(
        generatedStories[0],
        'exp-123',
        {
          achievements: ['Saved 30% cost'],
          kpiSuggestions: ['$50k saved'],
        }
      );
    });

    it('clears generation error on successful generation', async () => {
      const wrapper = await mountPage();
      wrapper.vm.generationError = 'Previous error';

      mockStoryService.generateStar.mockResolvedValue([]);

      await wrapper.vm.handleAutoGenerate();
      await flushPromises();

      expect(wrapper.vm.generationError).toBeNull();
    });
  });

  describe('State Management', () => {
    it('manages loading state correctly', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.loading).toBe(false);
    });

    it('manages deleting state correctly', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.deleting).toBe(false);
    });

    it('manages hasLoaded state correctly', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      expect(wrapper.vm.hasLoaded).toBe(true);
    });

    it('manages isGenerating state correctly', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.isGenerating).toBe(false);
    });

    it('tracks current experience', async () => {
      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.vm.currentExperience).toEqual(mockExperience);
    });
  });
});
