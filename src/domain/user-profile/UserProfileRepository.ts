import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
import type { UserProfileUpdateInput, UserProfile } from './UserProfile';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';

export type AmplifyUserProfileModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile | null }>;
  list: (
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile[]; nextToken?: string | null }>;
  update: (
    input: UserProfileUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: UserProfile | null }>;
};

export type AmplifyMutations = {
  deleteUserProfileWithAuth: (input: { userId: string }) => Promise<{ data: boolean | null }>;
};

export class UserProfileRepository {
  private readonly _model: AmplifyUserProfileModel;
  private readonly _mutations: AmplifyMutations;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   * @param mutations - Optional Amplify mutations instance (for testing)
   */
  constructor(model?: AmplifyUserProfileModel, mutations?: AmplifyMutations) {
    if (model && mutations) {
      // Use injected dependencies (for tests)
      this._model = model;
      this._mutations = mutations;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      const amplify = useNuxtApp().$Amplify.GraphQL.client;
      this._model = amplify.models.UserProfile;
      this._mutations = amplify.mutations;
    }
  }

  private get model() {
    return this._model;
  }

  private get mutations() {
    return this._mutations;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async list(filter: Record<string, unknown> = {}) {
    return fetchAllListItems<UserProfile>(this.model.list.bind(this.model), filter);
  }

  async getProgressSnapshot(id: string): Promise<{
    profile: UserProfile;
    experiences: Experience[];
    stories: STARStory[];
    personalCanvas: PersonalCanvas | null;
    cvs: CVDocument[];
    coverLetters: CoverLetter[];
    speechBlocks: SpeechBlock[];
    matchingSummaries: MatchingSummary[];
  } | null> {
    if (!id) {
      return null;
    }

    const selectionSet = [
      'id',
      'fullName',
      'primaryEmail',
      'primaryPhone',
      'workPermitInfo',
      'socialLinks',
      'skills',
      'languages',
      'strengths',
      'goals',
      'aspirations',
      'personalValues',
      'interests',
      'certifications',
      'headline',
      'location',
      'seniorityLevel',
      'experiences.*',
      'experiences.stories.*',
      'canvas.*',
      'cvs.*',
      'coverLetters.*',
      'speechBlocks.*',
      'matchingSummaries.*',
    ];

    const { data } = await this.model.get({ id }, gqlOptions({ selectionSet }));
    if (!data) {
      return null;
    }

    const profile = data;
    const dataRecord = data as unknown as Record<string, unknown>;
    const rawExperiences = dataRecord.experiences;
    const rawCanvas = dataRecord.canvas;
    const rawCvs = dataRecord.cvs;
    const rawCoverLetters = dataRecord.coverLetters;
    const rawSpeechBlocks = dataRecord.speechBlocks;
    const rawMatchingSummaries = dataRecord.matchingSummaries;

    const experiences = Array.isArray(rawExperiences)
      ? (rawExperiences.filter(Boolean) as Experience[])
      : [];

    const stories = Array.isArray(rawExperiences)
      ? rawExperiences
          .flatMap((exp) => {
            if (!exp || typeof exp !== 'object') {
              return [];
            }
            const storiesValue = (exp as { stories?: unknown }).stories;
            return Array.isArray(storiesValue) ? (storiesValue as STARStory[]) : [];
          })
          .filter(Boolean)
      : [];

    const personalCanvas = (rawCanvas as PersonalCanvas | null) ?? null;
    const cvs = Array.isArray(rawCvs) ? (rawCvs.filter(Boolean) as CVDocument[]) : [];
    const coverLetters = Array.isArray(rawCoverLetters)
      ? (rawCoverLetters.filter(Boolean) as CoverLetter[])
      : [];
    const speechBlocks = Array.isArray(rawSpeechBlocks)
      ? (rawSpeechBlocks.filter(Boolean) as SpeechBlock[])
      : [];
    const matchingSummaries = Array.isArray(rawMatchingSummaries)
      ? (rawMatchingSummaries.filter(Boolean) as MatchingSummary[])
      : [];

    return {
      profile,
      experiences,
      stories,
      personalCanvas,
      cvs,
      coverLetters,
      speechBlocks,
      matchingSummaries,
    };
  }

  async update(input: UserProfileUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  /**
   * Delete user profile and associated Cognito user
   * Uses Lambda mutation to delete both DynamoDB record and Cognito user in one call
   */
  async delete(id: string) {
    const { data } = await this.mutations.deleteUserProfileWithAuth({ userId: id });
    return data;
  }
}
