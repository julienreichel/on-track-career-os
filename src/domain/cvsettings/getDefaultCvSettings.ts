import type { CVSettings } from './CVSettings';
import type { Experience } from '@/domain/experience/Experience';

type DefaultCvSettingsInput = {
  settings?: CVSettings | null;
  experiences?: Experience[];
};

export type DefaultCvSettings = {
  defaultTemplateId: string | null;
  defaultDisabledSections: string[];
  defaultExcludedExperienceIds: string[];
  showProfilePhoto: boolean;
};

const normalizeStringArray = (values?: (string | null)[] | null): string[] =>
  (values ?? []).filter((value): value is string => Boolean(value));

const resolveDisabledSections = (settings?: CVSettings | null) =>
  normalizeStringArray(settings?.defaultDisabledSections ?? null);

const resolveExcludedExperiences = (settings?: CVSettings | null | undefined) =>
  normalizeStringArray(settings?.defaultExcludedExperienceIds ?? null);

export const getDefaultCvSettings = ({
  settings,
  experiences,
}: DefaultCvSettingsInput): DefaultCvSettings => {
  const defaults = {
    defaultTemplateId: settings?.defaultTemplateId ?? null,
    defaultDisabledSections: resolveDisabledSections(settings),
    defaultExcludedExperienceIds: resolveExcludedExperiences(settings),
    showProfilePhoto: settings?.showProfilePhoto ?? true,
  };

  if (experiences?.length) {
    const experienceIds = new Set(experiences.map((experience) => experience.id));
    defaults.defaultExcludedExperienceIds = defaults.defaultExcludedExperienceIds.filter((id) =>
      experienceIds.has(id)
    );
  }

  return defaults;
};
