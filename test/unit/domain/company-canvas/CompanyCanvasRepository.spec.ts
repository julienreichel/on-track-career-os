import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CompanyCanvasRepository,
  type AmplifyCompanyCanvasModel,
} from '@/domain/company-canvas/CompanyCanvasRepository';
import type {
  CompanyCanvas,
  CompanyCanvasCreateInput,
  CompanyCanvasUpdateInput,
} from '@/domain/company-canvas/CompanyCanvas';

const { gqlOptionsMock } = vi.hoisted(() => ({
  gqlOptionsMock: vi.fn((custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...(custom ?? {}),
  })),
}));

vi.mock('@/data/graphql/options', () => ({
  gqlOptions: gqlOptionsMock,
}));

describe('CompanyCanvasRepository', () => {
  let repository: CompanyCanvasRepository;
  let mockModel: {
    get: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockModel = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    repository = new CompanyCanvasRepository(mockModel as unknown as AmplifyCompanyCanvasModel);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a canvas by id', async () => {
    const canvas = { id: 'canvas-1' } as CompanyCanvas;
    mockModel.get.mockResolvedValue({ data: canvas });

    const result = await repository.get('canvas-1');

    expect(mockModel.get).toHaveBeenCalledWith(
      { id: 'canvas-1' },
      expect.objectContaining({ authMode: 'userPool' })
    );
    expect(gqlOptionsMock).toHaveBeenCalledWith();
    expect(result).toEqual(canvas);
  });

  it('lists canvases with optional filters', async () => {
    mockModel.list.mockResolvedValue({ data: [] });

    await repository.list({ companyId: 'c1' });

    expect(gqlOptionsMock).toHaveBeenCalledWith({ companyId: 'c1' });
    expect(mockModel.list).toHaveBeenCalledWith(
      expect.objectContaining({ authMode: 'userPool', companyId: 'c1' })
    );
  });

  it('creates a canvas', async () => {
    const input = { companyId: 'c1' } as CompanyCanvasCreateInput;
    const created = { id: 'canvas-1', companyId: 'c1' } as CompanyCanvas;
    mockModel.create.mockResolvedValue({ data: created });

    const result = await repository.create(input);

    expect(mockModel.create).toHaveBeenCalledWith(
      input,
      expect.objectContaining({ authMode: 'userPool' })
    );
    expect(result).toEqual(created);
  });

  it('updates a canvas', async () => {
    const input = { id: 'canvas-1', companyId: 'c1' } as CompanyCanvasUpdateInput;
    const updated = { ...input } as CompanyCanvas;
    mockModel.update.mockResolvedValue({ data: updated });

    const result = await repository.update(input);

    expect(mockModel.update).toHaveBeenCalledWith(
      input,
      expect.objectContaining({ authMode: 'userPool' })
    );
    expect(result).toEqual(updated);
  });

  it('deletes a canvas', async () => {
    mockModel.delete.mockResolvedValue({ data: null });

    await repository.delete('canvas-1');

    expect(mockModel.delete).toHaveBeenCalledWith(
      { id: 'canvas-1' },
      expect.objectContaining({ authMode: 'userPool' })
    );
  });

  it('fetches canvas by company id using list filter', async () => {
    const canvas = { id: 'canvas-1', companyId: 'c1' } as CompanyCanvas;
    mockModel.list.mockResolvedValue({ data: [canvas] });

    const result = await repository.getByCompanyId('c1');

    expect(mockModel.list).toHaveBeenCalledWith(
      expect.objectContaining({
        authMode: 'userPool',
        filter: { companyId: { eq: 'c1' } },
      })
    );
    expect(result).toEqual(canvas);
  });
});
