import classicEn from '@/content/templates/cv/en/classic.md?raw';
import modernEn from '@/content/templates/cv/en/modern.md?raw';
import competencyEn from '@/content/templates/cv/en/competency.md?raw';

export type SystemCvTemplateDefinition = {
  id: string;
  source: string;
  nameKey: string;
  descriptionKey: string;
  contentByLocale: Record<string, string> & { en: string };
};

export type SystemCvTemplate = {
  id: string;
  source: string;
  name: string;
  description: string;
  content: string;
};

export const SYSTEM_CV_TEMPLATE_DEFS: SystemCvTemplateDefinition[] = [
  {
    id: 'system:classic',
    source: 'system:classic',
    nameKey: 'cvTemplates.system.classic.name',
    descriptionKey: 'cvTemplates.system.classic.description',
    contentByLocale: {
      en: classicEn,
    },
  },
  {
    id: 'system:modern',
    source: 'system:modern',
    nameKey: 'cvTemplates.system.modern.name',
    descriptionKey: 'cvTemplates.system.modern.description',
    contentByLocale: {
      en: modernEn,
    },
  },
  {
    id: 'system:competency',
    source: 'system:competency',
    nameKey: 'cvTemplates.system.competency.name',
    descriptionKey: 'cvTemplates.system.competency.description',
    contentByLocale: {
      en: competencyEn,
    },
  },
];

export const resolveSystemCvTemplates = (
  locale: string,
  t: (key: string) => string
): SystemCvTemplate[] =>
  SYSTEM_CV_TEMPLATE_DEFS.map((template) => ({
    id: template.id,
    source: template.source,
    name: t(template.nameKey),
    description: t(template.descriptionKey),
    content: template.contentByLocale[locale] ?? template.contentByLocale.en,
  }));
