import { CV_SECTION_KEYS } from './CvSectionKey';
import type { CVSettings } from './CVSettings';
import type { Experience } from '@/domain/experience/Experience';

type DefaultCvSettingsInput = {
  settings?: CVSettings | null;
  experiences?: Experience[];
};

export type DefaultCvSettings = {
  askEachTime: boolean;
  defaultTemplateId: string | null;
  defaultEnabledSections: string[];
  defaultIncludedExperienceIds: string[];
  showProfilePhoto: boolean;
};

export const getDefaultCvSettings = ({
  settings,
  experiences,
}: DefaultCvSettingsInput): DefaultCvSettings => {
  const hasSections = Array.isArray(settings?.defaultEnabledSections);
  const hasExperiences = Array.isArray(settings?.defaultIncludedExperienceIds);
  const cleanedExperienceIds = hasExperiences
    ? (settings?.defaultIncludedExperienceIds ?? []).filter(
        (value): value is string => Boolean(value)
      )
    : [];
  const fallbackExperienceIds = (experiences ?? []).map((experience) => experience.id);

  return {
    askEachTime: settings?.askEachTime ?? false,
    defaultTemplateId: settings?.defaultTemplateId ?? null,
    defaultEnabledSections: hasSections
      ? (settings?.defaultEnabledSections ?? []).filter(
          (value): value is string => Boolean(value)
        )
      : CV_SECTION_KEYS,
    defaultIncludedExperienceIds:
      cleanedExperienceIds.length > 0 ? cleanedExperienceIds : fallbackExperienceIds,
    showProfilePhoto: settings?.showProfilePhoto ?? true,
  };
};
