import type { CompanyCanvas, CompanyCanvasUpdateInput } from './CompanyCanvas';
import { CompanyCanvasRepository } from './CompanyCanvasRepository';
import type { Company } from '@/domain/company/Company';
import { CompanyRepository } from '@/domain/company/CompanyRepository';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { GeneratedCompanyCanvasInput } from '@/domain/ai-operations/CompanyCanvasResult';
import { COMPANY_CANVAS_BLOCKS } from './canvasBlocks';
import { normalizeStringArray } from '@/domain/company/companyUtils';

type CanvasPatch = Partial<Omit<CompanyCanvasUpdateInput, 'id' | 'companyId'>>;

export class CompanyCanvasService {
  constructor(
    private canvasRepo = new CompanyCanvasRepository(),
    private companyRepo = new CompanyRepository(),
    private aiService = new AiOperationsService()
  ) {}

  async getByCompanyId(companyId: string) {
    const existing = await this.canvasRepo.getByCompanyId(companyId);
    return existing;
  }

  async saveDraft(companyId: string, patch: CanvasPatch) {
    const existing = await this.validateOrCreateCanvas(companyId);
    const normalized = this.normalizeBlocks(patch);

    const payload: CompanyCanvasUpdateInput = {
      id: existing.id,
      companyId,
      ...normalized,
      needsUpdate: true,
    };

    return this.canvasRepo.update(payload);
  }

  async regenerateCanvas(
    companyId: string,
    additionalNotes: string[] = []
  ): Promise<CompanyCanvas> {
    const [company, canvas] = await Promise.all([
      this.requireCompany(companyId),
      this.validateOrCreateCanvas(companyId),
    ]);

    const aiInput: GeneratedCompanyCanvasInput = {
      companyProfile: {
        companyName: company.companyName,
        industry: company.industry ?? '',
        sizeRange: company.sizeRange ?? '',
        productsServices: company.productsServices ?? [],
        targetMarkets: company.targetMarkets ?? [],
        customerSegments: company.customerSegments ?? [],
      },
      signals: {
        marketChallenges: company.marketChallenges ?? [],
        internalPains: company.internalPains ?? [],
        partnerships: company.partnerships ?? [],
        hiringFocus: company.hiringFocus ?? [],
        strategicNotes: company.strategicNotes ?? [],
      },
      additionalNotes,
    };

    const generated = await this.aiService.generateCompanyCanvas(aiInput);

    const payload: CompanyCanvasUpdateInput = {
      id: canvas.id,
      companyId,
      companyName: generated.companyName || company.companyName,
      customerSegments: generated.customerSegments,
      valuePropositions: generated.valuePropositions,
      channels: generated.channels,
      customerRelationships: generated.customerRelationships,
      revenueStreams: generated.revenueStreams,
      keyResources: generated.keyResources,
      keyActivities: generated.keyActivities,
      keyPartners: generated.keyPartners,
      costStructure: generated.costStructure,
      analysisSummary: generated.analysisSummary,
      lastGeneratedAt: new Date().toISOString(),
      needsUpdate: false,
      aiConfidence: generated.confidence,
    };

    return this.canvasRepo.update(payload);
  }

  private async validateOrCreateCanvas(companyId: string) {
    const existing = await this.canvasRepo.getByCompanyId(companyId);
    if (existing) {
      return existing;
    }

    const created = await this.canvasRepo.create({
      companyId,
      customerSegments: [],
      valuePropositions: [],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
      needsUpdate: true,
    });
    if (!created) {
      throw new Error('Failed to initialize company canvas');
    }
    return created;
  }

  private async requireCompany(companyId: string): Promise<Company> {
    const company = await this.companyRepo.get(companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    return company;
  }

  private normalizeBlocks(patch: CanvasPatch) {
    const normalized: CanvasPatch = { ...patch };
    COMPANY_CANVAS_BLOCKS.forEach((key) => {
      if (Array.isArray(normalized[key])) {
        normalized[key] = normalizeStringArray(normalized[key] as string[]);
      }
    });
    if (typeof normalized.analysisSummary === 'string') {
      normalized.analysisSummary = normalized.analysisSummary.trim();
    }
    return normalized;
  }
}
