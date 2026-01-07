import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobDescriptionRepository } from '@/domain/job-description/JobDescriptionRepository';
import type {
  JobDescription,
  JobDescriptionCreateInput,
  JobDescriptionUpdateInput,
} from '@/domain/job-description/JobDescription';

describe('JobDescriptionRepository', () => {
  const mockModel = {
    get: vi.fn(),
    listJobDescriptionByOwner: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const buildRepository = () => new JobDescriptionRepository(mockModel);

  it('should get a job description by id', async () => {
    const mockJob = { id: 'job-123' } as JobDescription;
    mockModel.get.mockResolvedValue({ data: mockJob });

    const repo = buildRepository();
    const result = await repo.get('job-123');

    expect(mockModel.get).toHaveBeenCalledWith({ id: 'job-123' }, expect.any(Object));
    expect(result).toEqual(mockJob);
  });

  it('should return null when job description is not found', async () => {
    mockModel.get.mockResolvedValue({ data: null });

    const repo = buildRepository();
    const result = await repo.get('missing-id');

    expect(result).toBeNull();
  });

  it('should list job descriptions by owner', async () => {
    const mockData = [{ id: 'job-1' }] as JobDescription[];
    mockModel.listJobDescriptionByOwner.mockResolvedValue({ data: mockData });

    const repo = buildRepository();
    const result = await repo.listByOwner('user-1::user-1');

    expect(mockModel.listJobDescriptionByOwner).toHaveBeenCalledWith(
      { owner: 'user-1::user-1' },
      expect.any(Object)
    );
    expect(result).toEqual(mockData);
  });

  it('should create a job description', async () => {
    const input = { id: 'job-create' } as JobDescriptionCreateInput;
    const created = { id: 'job-create' } as JobDescription;
    mockModel.create.mockResolvedValue({ data: created });

    const repo = buildRepository();
    const result = await repo.create(input);

    expect(mockModel.create).toHaveBeenCalledWith(input, expect.any(Object));
    expect(result).toEqual(created);
  });

  it('should update a job description', async () => {
    const input = { id: 'job-update' } as JobDescriptionUpdateInput;
    const updated = { id: 'job-update', title: 'Updated' } as JobDescription;
    mockModel.update.mockResolvedValue({ data: updated });

    const repo = buildRepository();
    const result = await repo.update(input);

    expect(mockModel.update).toHaveBeenCalledWith(input, expect.any(Object));
    expect(result).toEqual(updated);
  });

  it('should delete a job description', async () => {
    mockModel.delete.mockResolvedValue({ data: null });
    const repo = buildRepository();

    await repo.delete('job-delete');

    expect(mockModel.delete).toHaveBeenCalledWith({ id: 'job-delete' }, expect.any(Object));
  });
});
