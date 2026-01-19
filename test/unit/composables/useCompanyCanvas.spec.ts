import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCompanyCanvas } from '@/application/company/useCompanyCanvas';
import { CompanyCanvasService } from '@/domain/company-canvas/CompanyCanvasService';
import type { CompanyCanvas } from '@/domain/company-canvas/CompanyCanvas';

vi.mock('@/domain/company-canvas/CompanyCanvasService');

describe('useCompanyCanvas', () => {
  let service: vi.Mocked<CompanyCanvasService>;

  beforeEach(() => {
    service = {
      saveDraft: vi.fn(),
      regenerateCanvas: vi.fn(),
    } as unknown as vi.Mocked<CompanyCanvasService>;
    vi.mocked(CompanyCanvasService).mockImplementation(() => service);
  });

  it('saves drafts through service', async () => {
    const existing = {
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
    const updated = { ...existing, customerSegments: ['Enterprise'] } as CompanyCanvas;
    service.saveDraft.mockResolvedValue(updated);

    const composable = useCompanyCanvas('c1');
    composable.hydrate(existing);
    composable.updateBlock('customerSegments', ['Enterprise']);
    await composable.save();

    expect(service.saveDraft).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        customerSegments: ['Enterprise'],
      }),
      existing
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

  it('regenerates through service with existing canvas', async () => {
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
    service.regenerateCanvas.mockResolvedValue(canvas);

    const composable = useCompanyCanvas('c1');
    composable.hydrate(canvas);

    await composable.regenerate(['note']);

    expect(service.regenerateCanvas).toHaveBeenCalledWith('c1', ['note'], canvas);
  });
});
