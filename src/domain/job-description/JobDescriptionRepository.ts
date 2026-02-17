import { gqlOptions } from '@/data/graphql/options';
import { fetchAllListItems } from '@/data/graphql/pagination';
import type {
  JobDescriptionCreateInput,
  JobDescriptionUpdateInput,
  JobDescription,
} from './JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';

export type AmplifyJobDescriptionModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: JobDescription | null }>;
  listJobDescriptionByOwner: (
    input: { owner: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: JobDescription[]; nextToken?: string | null }>;
  create: (
    input: JobDescriptionCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: JobDescription | null }>;
  update: (
    input: JobDescriptionUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: JobDescription | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: JobDescription | null }>;
};

export class JobDescriptionRepository {
  private readonly _model: AmplifyJobDescriptionModel;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: AmplifyJobDescriptionModel) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.JobDescription;
    }
  }

  private get model() {
    return this._model;
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async getSummary(id: string) {
    const selectionSet = ['id', 'title', 'companyId'];
    const res = await this.model.get({ id }, gqlOptions({ selectionSet }));
    return res.data;
  }

  async getWithRelations(id: string) {
    const selectionSet = [
      'id',
      'rawText',
      'owner',
      'title',
      'seniorityLevel',
      'roleSummary',
      'responsibilities',
      'requiredSkills',
      'behaviours',
      'successCriteria',
      'explicitPains',
      'atsKeywords',
      'status',
      'kanbanStatus',
      'notes',
      'companyId',
      'createdAt',
      'updatedAt',
      'company.*',
      'matchingSummaries.*',
      'cvs.*',
      'coverLetters.*',
      'speechBlocks.*',
    ];

    const res = await this.model.get({ id }, gqlOptions({ selectionSet }));
    return res.data;
  }

  async getMatchingSummaries(id: string): Promise<MatchingSummary[]> {
    const selectionSet = ['id', 'matchingSummaries.*'];
    const res = await this.model.get({ id }, gqlOptions({ selectionSet }));
    const data = res.data as
      | (JobDescription & {
          matchingSummaries?: (MatchingSummary | null)[] | null;
        })
      | null;
    const summaries = (data?.matchingSummaries ?? []) as MatchingSummary[];
    return summaries.filter((summary): summary is MatchingSummary => Boolean(summary));
  }

  async listByOwner(owner: string): Promise<JobDescription[]> {
    if (!owner) {
      return [];
    }

    const selectionSet = [
      'id',
      'owner',
      'title',
      'seniorityLevel',
      'roleSummary',
      'status',
      'kanbanStatus',
      'notes',
      'companyId',
      'createdAt',
      'updatedAt',
      'company.companyName',
      'matchingSummaries.overallScore',
      'matchingSummaries.updatedAt',
      'matchingSummaries.createdAt',
      'matchingSummaries.generatedAt',
    ];

    return fetchAllListItems<JobDescription>(
      (options) => this.model.listJobDescriptionByOwner({ owner }, options),
      { selectionSet }
    );
  }

  async create(input: JobDescriptionCreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: JobDescriptionUpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
