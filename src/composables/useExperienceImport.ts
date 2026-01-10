import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';

/**
 * Composable for importing experiences to database
 * Handles batch creation of experience entities
 */
export function useExperienceImport() {
  const experienceRepo = new ExperienceRepository();

  async function importExperiences(
    experiences: ExtractedExperience[],
    rawText: string,
    userId: string
  ): Promise<number> {
    const createPromises = experiences.map((exp) =>
      experienceRepo.create({
        title: exp.title,
        companyName: exp.companyName,
        startDate: exp.startDate,
        endDate: exp.endDate || undefined,
        responsibilities: exp.responsibilities,
        tasks: exp.tasks,
        rawText,
        status: 'draft',
        userId,
      })
    );

    const results = await Promise.all(createPromises);
    return results.filter((r) => r !== null).length;
  }

  return {
    importExperiences,
  };
}
