import type { CompanyCreateInput, CompanyUpdateInput } from './Company';
import { CompanyRepository } from './CompanyRepository';
import { applyArrayNormalization } from './companyUtils';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { AnalyzeCompanyInfoInput } from '@/domain/ai-operations/CompanyAnalysis';
import { mergeCompanyProfile } from './companyMatching';

type CompanyInput = Partial<Omit<CompanyCreateInput, 'owner'>> & { companyName: string };
type CompanyUpdatePayload = Partial<Omit<CompanyUpdateInput, 'owner'>>;

type AnalyzeOptions = {
  rawText?: string;
  jobContext?: {
    title?: string;
    summary?: string;
  };
};

const ARRAY_FIELDS: (keyof CompanyInput)[] = [
  'productsServices',
  'targetMarkets',
  'customerSegments',
];

export class CompanyService {
  constructor(
    private repo = new CompanyRepository(),
    private aiService = new AiOperationsService()
  ) {}

  async listCompanies(ownerId: string) {
    return this.repo.listByOwner(ownerId);
  }

  async getCompany(id: string) {
    return this.repo.get(id);
  }

  async getCompanyWithRelations(id: string) {
    return this.repo.getWithRelations(id);
  }

  async createCompany(input: CompanyInput, options?: { analyze?: boolean } & AnalyzeOptions) {
    if (!input.companyName?.trim()) {
      throw new Error('Company name is required');
    }

    const normalized = this.normalizeCompanyInput(input);
    const created = await this.repo.create(normalized as CompanyCreateInput);

    if (created && options?.analyze && (options.rawText || created.rawNotes)) {
      return this.analyzeCompany(created.id, {
        rawText: options.rawText ?? created.rawNotes ?? '',
        jobContext: options.jobContext,
      });
    }

    return created;
  }

  async updateCompany(id: string, patch: CompanyUpdatePayload) {
    if (!id) {
      throw new Error('Company ID is required for update');
    }

    const normalizedPatch = this.normalizeUpdateInput(patch);
    const payload: CompanyUpdateInput = {
      id,
      ...normalizedPatch,
    };
    const updated = await this.repo.update(payload);
    return updated;
  }

  async deleteCompany(id: string) {
    if (!id) {
      throw new Error('Company ID is required');
    }
    await this.repo.delete(id);
  }

  async analyzeCompany(id: string, options?: AnalyzeOptions) {
    const company = await this.repo.get(id);
    if (!company) {
      throw new Error('Company not found');
    }

    const rawText = options?.rawText ?? company.rawNotes;
    if (!rawText?.trim()) {
      throw new Error('No company research text available for analysis');
    }

    const input: AnalyzeCompanyInfoInput = {
      companyName: company.companyName,
      industry: company.industry ?? '',
      size: company.sizeRange ?? '',
      rawText,
      jobContext: options?.jobContext,
    };

    const analysis = await this.aiService.analyzeCompanyInfo(input);

    const merged = mergeCompanyProfile(company, analysis.companyProfile);
    const analyzedName = analysis.companyProfile.companyName?.trim();
    const updatePayload: CompanyUpdateInput = {
      id: company.id,
      ...merged,
      companyName: analyzedName || company.companyName,
      rawNotes: company.rawNotes,
    };

    return this.repo.update(updatePayload);
  }

  private normalizeCompanyInput<T extends CompanyInput>(input: T): T {
    const next = applyArrayNormalization(input, ARRAY_FIELDS);
    next.companyName = input.companyName.trim();
    if (typeof next.rawNotes === 'string') {
      next.rawNotes = next.rawNotes.trim();
    }
    if (typeof next.description === 'string') {
      next.description = next.description.trim();
    }
    return next;
  }

  private normalizeUpdateInput(input: CompanyUpdatePayload): CompanyUpdatePayload {
    const next = applyArrayNormalization(input, ARRAY_FIELDS);
    if (typeof next.companyName === 'string') {
      next.companyName = next.companyName.trim();
      if (!next.companyName) {
        delete next.companyName;
      }
    }
    if (typeof next.rawNotes === 'string') {
      next.rawNotes = next.rawNotes.trim();
      if (!next.rawNotes) {
        delete next.rawNotes;
      }
    }
    if (typeof next.description === 'string') {
      next.description = next.description.trim();
      if (!next.description) {
        delete next.description;
      }
    }
    return next;
  }
}
