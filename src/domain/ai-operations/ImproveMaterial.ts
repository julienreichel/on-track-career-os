import type {
  CompanyProfile,
  Experience,
  ImproveMaterialInstructions,
  JobDescription,
  MatchingSummaryContext,
  Profile,
  SpeechStory,
} from '@amplify/data/ai-operations/types/schema-types';
import type { ApplicationStrengthResult } from './ApplicationStrengthResult';

export type ImproveMaterialType = 'cv' | 'coverLetter';

export type ImproveMaterialInput = {
  language: 'en';
  materialType: ImproveMaterialType;
  currentMarkdown: string;
  instructions: ImproveMaterialInstructions;
  improvementContext: ApplicationStrengthResult;
  profile: Profile;
  experiences: Experience[];
  stories?: SpeechStory[];
  jobDescription?: JobDescription;
  matchingSummary?: MatchingSummaryContext;
  company?: CompanyProfile;
};

export function isImprovedMaterialMarkdown(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
