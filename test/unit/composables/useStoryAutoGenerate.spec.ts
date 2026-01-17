import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStoryAutoGenerate } from '@/composables/useStoryAutoGenerate';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import { allowConsoleOutput, getConsoleCalls } from '../../setup/console-guard';

vi.mock('@/domain/experience/ExperienceService', () => ({
  ExperienceService: vi.fn(),
}));

vi.mock('@/domain/starstory/STARStoryService', () => ({
  STARStoryService: vi.fn(),
}));

describe('useStoryAutoGenerate', () => {
  let experienceServiceMock: {
    getFullExperience: ReturnType<typeof vi.fn>;
  };
  let storyServiceMock: {
    generateStar: ReturnType<typeof vi.fn>;
    generateAchievements: ReturnType<typeof vi.fn>;
    createAndLinkStory: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    experienceServiceMock = {
      getFullExperience: vi.fn(),
    };
    storyServiceMock = {
      generateStar: vi.fn(),
      generateAchievements: vi.fn(),
      createAndLinkStory: vi.fn(),
    };

    vi.mocked(ExperienceService).mockImplementation(() => experienceServiceMock as never);
    vi.mocked(STARStoryService).mockImplementation(() => storyServiceMock as never);
  });

  it('generates stories for each experience', async () => {
    const experience = {
      id: 'exp-1',
      title: 'Engineer',
      companyName: 'Acme',
      startDate: '2024-01-01',
      endDate: null,
      responsibilities: ['Build features'],
      tasks: ['Ship code'],
    };

    experienceServiceMock.getFullExperience.mockResolvedValue(experience);
    storyServiceMock.generateStar.mockResolvedValue([
      {
        title: 'Story 1',
        situation: 'Situation',
        task: 'Task',
        action: 'Action',
        result: 'Result',
      },
    ]);
    storyServiceMock.generateAchievements.mockResolvedValue({
      achievements: ['Achievement'],
      kpiSuggestions: ['KPI'],
    });

    const { generateStories, isGenerating, error } = useStoryAutoGenerate();

    await generateStories(['exp-1', 'exp-2']);

    expect(isGenerating.value).toBe(false);
    expect(error.value).toBeNull();
    expect(experienceServiceMock.getFullExperience).toHaveBeenCalledTimes(2);
    expect(storyServiceMock.generateStar).toHaveBeenCalledTimes(2);
    expect(storyServiceMock.createAndLinkStory).toHaveBeenCalledTimes(2);
  });

  it('sets an error when experience is missing', async () => {
    experienceServiceMock.getFullExperience.mockResolvedValue(null);

    const { generateStories, isGenerating, error } = useStoryAutoGenerate();

    await allowConsoleOutput(async () => {
      await generateStories(['exp-missing']);
    });

    expect(isGenerating.value).toBe(false);
    expect(error.value).toBe('Experience not found');
    expect(storyServiceMock.createAndLinkStory).not.toHaveBeenCalled();
    expect(getConsoleCalls().some((call) => call.method === 'error')).toBe(true);
  });

  it('continues when achievements generation fails', async () => {
    const experience = {
      id: 'exp-1',
      title: 'Engineer',
      companyName: 'Acme',
      startDate: '2024-01-01',
      endDate: null,
      responsibilities: [],
      tasks: [],
    };

    experienceServiceMock.getFullExperience.mockResolvedValue(experience);
    storyServiceMock.generateStar.mockResolvedValue([
      {
        title: 'Story 1',
        situation: 'Situation',
        task: 'Task',
        action: 'Action',
        result: 'Result',
      },
    ]);
    storyServiceMock.generateAchievements.mockRejectedValue(new Error('Failed'));

    const { generateStories, error } = useStoryAutoGenerate();

    await allowConsoleOutput(async () => {
      await generateStories(['exp-1']);
    });

    expect(error.value).toBeNull();
    expect(storyServiceMock.createAndLinkStory).toHaveBeenCalledWith(
      {
        title: 'Story 1',
        situation: 'Situation',
        task: 'Task',
        action: 'Action',
        result: 'Result',
      },
      'exp-1',
      {
        achievements: [],
        kpiSuggestions: [],
      }
    );
    expect(getConsoleCalls().some((call) => call.method === 'error')).toBe(true);
  });
});
