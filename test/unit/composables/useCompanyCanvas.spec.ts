import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCompanyCanvas } from '@/application/company/useCompanyCanvas';
import { CompanyCanvasService } from '@/domain/company-canvas/CompanyCanvasService';
import type { CompanyCanvas } from '@/domain/company-canvas/CompanyCanvas';

vi.mock('@/domain/company-canvas/CompanyCanvasService');

describe('useCompanyCanvas', () => {
  let service: vi.Mocked<CompanyCanvasService>;

  beforeEach(() => {
    service = {
      getByCompanyId: vi.fn(),
      saveDraft: vi.fn(),
      regenerateCanvas: vi.fn(),
    } as unknown as vi.Mocked<CompanyCanvasService>;
    vi.mocked(CompanyCanvasService).mockImplementation(() => service);
  });

  it('loads canvas and hydrates draft', async () => {
    const canvas = {
      id: 'canvas-1',
      companyId: 'c1',
      customerSegments: ['Startups'],
      valuePropositions: [],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
    } as CompanyCanvas;
    service.getByCompanyId.mockResolvedValue(canvas);
    const composable = useCompanyCanvas('c1');

    await composable.load();
    expect(composable.draftBlocks.value.customerSegments).toEqual(['Startups']);
    expect(composable.dirty.value).toBe(false);
  });

  it('saves drafts through service', async () => {
    const updated = {
      id: 'canvas-1',
      companyId: 'c1',
      customerSegments: ['Enterprise'],
      valuePropositions: [],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
    } as CompanyCanvas;
    service.getByCompanyId.mockResolvedValue(updated);
    service.saveDraft.mockResolvedValue(updated);

    const composable = useCompanyCanvas('c1');
    await composable.load();
    composable.updateBlock('customerSegments', ['Enterprise']);
    await composable.save();

    expect(service.saveDraft).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        customerSegments: ['Enterprise'],
      })
    );
    expect(composable.dirty.value).toBe(false);
  });

  it('hydrates state from provided canvas', () => {
    const composable = useCompanyCanvas('c1');
    const canvas = {
      id: 'canvas-1',
      companyId: 'c1',
      customerSegments: ['Enterprise'],
      valuePropositions: [],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
    } as CompanyCanvas;

    composable.hydrate(canvas);

    expect(composable.canvas.value).toEqual(canvas);
    expect(composable.draftBlocks.value.customerSegments).toEqual(['Enterprise']);
    expect(composable.dirty.value).toBe(false);
  });
});
