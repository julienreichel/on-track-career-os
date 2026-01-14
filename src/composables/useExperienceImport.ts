import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';

const KEYWORD_MIN_LENGTH = 5;
const KEYWORD_OVERLAP_THRESHOLD = 3;

export type ExperienceImportResult = {
  createdCount: number;
  updatedCount: number;
};

function normalizeValue(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function extractKeywords(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-zA-Z]+/g) ?? [];
  return new Set(words.filter((word) => word.length > KEYWORD_MIN_LENGTH));
}

function hasRedundantKeywords(existingText: string, incomingText: string): boolean {
  const incomingKeywords = extractKeywords(incomingText);
  if (incomingKeywords.size === 0) return false;

  const existingKeywords = extractKeywords(existingText);
  if (existingKeywords.size === 0) return false;

  let overlap = 0;
  for (const keyword of incomingKeywords) {
    if (existingKeywords.has(keyword)) {
      overlap += 1;
      if (overlap > KEYWORD_OVERLAP_THRESHOLD) return true;
    }
  }

  return false;
}

function isRedundant(existingText: string, incomingText: string): boolean {
  if (normalizeValue(existingText) === normalizeValue(incomingText)) return true;
  return hasRedundantKeywords(existingText, incomingText);
}

function mergeTextItems(
  existingItems: Array<string | null | undefined> = [],
  incomingItems: Array<string | null | undefined> = []
): string[] {
  const result = existingItems
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item && item.length > 0));

  incomingItems.forEach((item) => {
    const trimmed = item?.trim();
    if (!trimmed) return;
    const isDuplicate = result.some((existing) => isRedundant(existing, trimmed));
    if (!isDuplicate) {
      result.push(trimmed);
    }
  });

  return result;
}

function isMatchingExperience(existing: Experience, incoming: ExtractedExperience): boolean {
  return (
    normalizeValue(existing.title) === normalizeValue(incoming.title) &&
    normalizeValue(existing.companyName) === normalizeValue(incoming.companyName) &&
    normalizeValue(existing.startDate) === normalizeValue(incoming.startDate) &&
    normalizeValue(existing.endDate) === normalizeValue(incoming.endDate)
  );
}

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
  ): Promise<ExperienceImportResult> {
    const existingExperiences = await experienceRepo.list(userId);
    const workingExperiences = [...existingExperiences];
    let createdCount = 0;
    let updatedCount = 0;

    await Promise.all(
      experiences.map(async (exp) => {
        const match = workingExperiences.find((existing) => isMatchingExperience(existing, exp));

        if (match) {
          const responsibilities = mergeTextItems(
            match.responsibilities ?? [],
            exp.responsibilities ?? []
          );
          const tasks = mergeTextItems(match.tasks ?? [], exp.tasks ?? []);

          const updated = await experienceRepo.update({
            id: match.id,
            responsibilities,
            tasks,
          });

          if (updated) {
            updatedCount += 1;
            const index = workingExperiences.findIndex((item) => item.id === match.id);
            if (index >= 0) {
              workingExperiences[index] = {
                ...match,
                responsibilities,
                tasks,
              };
            }
          }

          return updated;
        }

        const created = await experienceRepo.create({
          title: exp.title,
          companyName: exp.companyName,
          startDate: exp.startDate,
          endDate: exp.endDate || undefined,
          responsibilities: exp.responsibilities,
          tasks: exp.tasks,
          rawText,
          status: 'draft',
          userId,
        });

        if (created) {
          createdCount += 1;
          workingExperiences.push(created);
        }

        return created;
      })
    );

    return {
      createdCount,
      updatedCount,
    };
  }

  return {
    importExperiences,
  };
}
