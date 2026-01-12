import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompanyCanvasService } from '@/domain/company-canvas/CompanyCanvasService';
import type { CompanyCanvasRepository } from '@/domain/company-canvas/CompanyCanvasRepository';
import type { CompanyRepository } from '@/domain/company/CompanyRepository';
import type { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { CompanyCanvas } from '@/domain/company-canvas/CompanyCanvas';
import type { Company } from '@/domain/company/Company';

vi.mock('@/domain/company-canvas/CompanyCanvasRepository');
vi.mock('@/domain/company/CompanyRepository');
vi.mock('@/domain/ai-operations/AiOperationsService');

describe('CompanyCanvasService', () => {
  let canvasRepo: vi.Mocked<CompanyCanvasRepository>;
  let companyRepo: vi.Mocked<CompanyRepository>;
  let ai: vi.Mocked<AiOperationsService>;
  let service: CompanyCanvasService;

  beforeEach(() => {
    canvasRepo = {
      getByCompanyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as vi.Mocked<CompanyCanvasRepository>;

    companyRepo = {
      get: vi.fn(),
    } as unknown as vi.Mocked<CompanyRepository>;

    ai = {
      generateCompanyCanvas: vi.fn(),
    } as unknown as vi.Mocked<AiOperationsService>;

    service = new CompanyCanvasService(canvasRepo, companyRepo, ai);
  });

  it('saves drafts and marks canvas as needing update', async () => {
    const canvas = {
      id: 'canvas-1',
      companyId: 'company-1',
      customerSegments: [],
    } as CompanyCanvas;
    canvasRepo.getByCompanyId.mockResolvedValue(canvas);
    canvasRepo.update.mockResolvedValue({
      ...canvas,
      customerSegments: ['Fintech'],
    } as CompanyCanvas);

    const result = await service.saveDraft('company-1', {
      customerSegments: [' Fintech ', 'fintech'],
    });

    expect(canvasRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'canvas-1',
        companyId: 'company-1',
        customerSegments: ['Fintech'],
        needsUpdate: true,
      })
    );
    expect(result.customerSegments).toEqual(['Fintech']);
  });

  it('regenerates canvas via AI and clears needsUpdate', async () => {
    const canvas = {
      id: 'canvas-1',
      companyId: 'company-1',
      customerSegments: [],
    } as CompanyCanvas;
    canvasRepo.getByCompanyId.mockResolvedValue(canvas);
    companyRepo.get.mockResolvedValue({
      id: 'company-1',
      companyName: 'Acme',
      productsServices: ['API'],
      targetMarkets: [],
      customerSegments: [],
    } as Company);
    ai.generateCompanyCanvas.mockResolvedValue({
      companyName: 'Acme',
      customerSegments: ['Startups'],
      valuePropositions: ['Automation'],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
    });
    canvasRepo.update.mockResolvedValue({
      ...canvas,
      customerSegments: ['Startups'],
      needsUpdate: false,
    } as CompanyCanvas);

    const regenerated = await service.regenerateCanvas('company-1');

    expect(ai.generateCompanyCanvas).toHaveBeenCalled();
    expect(canvasRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        needsUpdate: false,
      })
    );
    expect(regenerated.customerSegments).toEqual(['Startups']);
  });

  it('initializes canvas when none exists before saving', async () => {
    canvasRepo.getByCompanyId.mockResolvedValueOnce(null);
    canvasRepo.create.mockResolvedValue({
      id: 'canvas-1',
      companyId: 'company-1',
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
    } as CompanyCanvas);
    canvasRepo.update.mockResolvedValue({
      id: 'canvas-1',
      companyId: 'company-1',
      customerSegments: ['Fintech'],
      needsUpdate: true,
    } as CompanyCanvas);

    await service.saveDraft('company-1', {
      customerSegments: ['Fintech'],
    });

    expect(canvasRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        needsUpdate: true,
      })
    );
  });

  it('throws when regenerating canvas for unknown company', async () => {
    canvasRepo.getByCompanyId.mockResolvedValue({
      id: 'canvas-1',
      companyId: 'company-1',
      customerSegments: [],
    } as CompanyCanvas);
    companyRepo.get.mockResolvedValue(null);

    await expect(service.regenerateCanvas('company-1')).rejects.toThrow('Company not found');
  });

  it('passes additional notes to AI during regeneration', async () => {
    const canvas = {
      id: 'canvas-1',
      companyId: 'company-1',
      customerSegments: [],
    } as CompanyCanvas;
    canvasRepo.getByCompanyId.mockResolvedValue(canvas);
    companyRepo.get.mockResolvedValue({
      id: 'company-1',
      companyName: 'Acme',
      productsServices: [],
      targetMarkets: [],
      customerSegments: [],
    } as Company);
    ai.generateCompanyCanvas.mockResolvedValue({
      companyName: 'Acme',
      customerSegments: [],
      valuePropositions: [],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
    });
    canvasRepo.update.mockResolvedValue(canvas);

    await service.regenerateCanvas('company-1', ['note']);

    expect(ai.generateCompanyCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        additionalNotes: ['note'],
      })
    );
  });
});
