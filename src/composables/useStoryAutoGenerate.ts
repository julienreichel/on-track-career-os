import { ref } from 'vue';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { Experience } from '@/domain/experience/Experience';

type GeneratedStory = {
  title?: string | null;
  situation?: string | null;
  task?: string | null;
  action?: string | null;
  result?: string | null;
};

type StoryPayload = {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
};

const ERROR_FALLBACK_KEY = 'common.error';

const formatExperienceAsText = (experience: Experience): string => {
  const lines = [];

  lines.push(`Job Title: ${experience.title}`);

  if (experience.companyName) {
    lines.push(`Company: ${experience.companyName}`);
  }

  const startDate = experience.startDate ? new Date(experience.startDate).toLocaleDateString() : '';
  const endDate = experience.endDate
    ? new Date(experience.endDate).toLocaleDateString()
    : 'Present';
  lines.push(`Duration: ${startDate} - ${endDate}`);
  lines.push('');

  if (experience.responsibilities && experience.responsibilities.length > 0) {
    lines.push('Responsibilities:');
    experience.responsibilities.forEach((resp) => lines.push(`- ${resp}`));
    lines.push('');
  }

  if (experience.tasks && experience.tasks.length > 0) {
    lines.push('Tasks & Achievements:');
    experience.tasks.forEach((task) => lines.push(`- ${task}`));
  }

  return lines.join('\n');
};

const toStoryPayload = (story: GeneratedStory): StoryPayload => ({
  title: story.title ?? '',
  situation: story.situation ?? '',
  task: story.task ?? '',
  action: story.action ?? '',
  result: story.result ?? '',
});

const generateAchievements = async (
  storyService: STARStoryService,
  story: StoryPayload
): Promise<{ achievements: string[]; kpiSuggestions: string[] }> => {
  try {
    const achievementsData = await storyService.generateAchievements(story);
    return {
      achievements: achievementsData.achievements || [],
      kpiSuggestions: achievementsData.kpiSuggestions || [],
    };
  } catch (err) {
    console.error('[Stories] Failed to generate achievements for story:', err);
    return { achievements: [], kpiSuggestions: [] };
  }
};

const generateStoriesForExperience = async (
  experienceService: ExperienceService,
  storyService: STARStoryService,
  experienceId: string
) => {
  const experience = await experienceService.getFullExperience(experienceId);
  if (!experience) {
    throw new Error('Experience not found');
  }

  const formattedText = formatExperienceAsText(experience);
  const generatedStories = await storyService.generateStar(formattedText);

  for (const story of generatedStories) {
    const payload = toStoryPayload(story);
    const { achievements, kpiSuggestions } = await generateAchievements(storyService, payload);

    await storyService.createAndLinkStory(payload, experienceId, {
      achievements,
      kpiSuggestions,
    });
  }
};

export function useStoryAutoGenerate() {
  const isGenerating = ref(false);
  const error = ref<string | null>(null);

  const experienceService = new ExperienceService();
  const storyService = new STARStoryService();

  const generateStories = async (experienceIds: string[]) => {
    if (experienceIds.length === 0) return;

    isGenerating.value = true;
    error.value = null;

    try {
      for (const experienceId of experienceIds) {
        await generateStoriesForExperience(experienceService, storyService, experienceId);
      }
    } catch (err) {
      console.error('[Stories] Auto-generation error:', err);
      error.value = err instanceof Error ? err.message : ERROR_FALLBACK_KEY;
    } finally {
      isGenerating.value = false;
    }
  };

  return {
    generateStories,
    isGenerating,
    error,
  };
}
