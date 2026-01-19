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
    const company = await this.companyRepo.getWithRelations(companyId);
    return (company?.canvas ?? null) as CompanyCanvas | null;
  }

  async saveDraft(companyId: string, patch: CanvasPatch, existingCanvas?: CompanyCanvas | null) {
    const existing = await this.ensureCanvas(companyId, existingCanvas);
    const normalized = this.normalizeBlocks(patch);

    const payload: CompanyCanvasUpdateInput = {
      id: existing.id,
      companyId,
      ...normalized,
      needsUpdate: true,
    };

    const updated = await this.canvasRepo.update(payload);
    if (!updated) {
      throw new Error('Failed to update company canvas');
    }
    return updated;
  }

  async regenerateCanvas(
    companyId: string,
    additionalNotes: string[] = [],
    existingCanvas?: CompanyCanvas | null
  ): Promise<CompanyCanvas> {
    const [company, canvas] = await Promise.all([
      this.requireCompany(companyId),
      this.ensureCanvas(companyId, existingCanvas),
    ]);

    const aiInput: GeneratedCompanyCanvasInput = {
      companyProfile: {
        companyName: company.companyName,
        industry: company.industry ?? '',
        sizeRange: company.sizeRange ?? '',
        website: company.website ?? '',
        description: company.description ?? '',
        productsServices: (company.productsServices ?? []).filter((s): s is string => s !== null),
        targetMarkets: (company.targetMarkets ?? []).filter((s): s is string => s !== null),
        customerSegments: (company.customerSegments ?? []).filter((s): s is string => s !== null),
        rawNotes: company.rawNotes ?? '',
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
      lastGeneratedAt: new Date().toISOString(),
      needsUpdate: false,
    };

    const updated = await this.canvasRepo.update(payload);
    if (!updated) {
      throw new Error('Failed to update company canvas');
    }
    return updated;
  }

  private async ensureCanvas(companyId: string, existingCanvas?: CompanyCanvas | null) {
    if (existingCanvas) {
      return existingCanvas;
    }

    const company = await this.companyRepo.getWithRelations(companyId);
    const companyCanvas = (company?.canvas ?? null) as CompanyCanvas | null;
    if (companyCanvas) {
      return companyCanvas;
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
    return normalized;
  }
}
