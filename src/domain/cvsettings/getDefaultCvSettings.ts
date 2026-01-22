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

const normalizeStringArray = (values?: (string | null)[] | null): string[] =>
  (values ?? []).filter((value): value is string => Boolean(value));

const resolveEnabledSections = (settings?: CVSettings | null) => {
  const sections = normalizeStringArray(settings?.defaultEnabledSections ?? null);
  return sections.length > 0 ? sections : CV_SECTION_KEYS;
};

const resolveIncludedExperiences = (
  settings: CVSettings | null | undefined,
  experiences?: Experience[]
) => {
  const explicitIds = normalizeStringArray(settings?.defaultIncludedExperienceIds ?? null);
  if (explicitIds.length > 0) return explicitIds;
  return (experiences ?? []).map((experience) => experience.id);
};

export const getDefaultCvSettings = ({
  settings,
  experiences,
}: DefaultCvSettingsInput): DefaultCvSettings => {
  return {
    askEachTime: settings?.askEachTime ?? false,
    defaultTemplateId: settings?.defaultTemplateId ?? null,
    defaultEnabledSections: resolveEnabledSections(settings),
    defaultIncludedExperienceIds: resolveIncludedExperiences(settings, experiences),
    showProfilePhoto: settings?.showProfilePhoto ?? true,
  };
};
