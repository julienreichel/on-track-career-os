import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobRoleCardRepository } from '@/domain/job-role-card/JobRoleCardRepository';
import type {
  JobRoleCard,
  JobRoleCardCreateInput,
  JobRoleCardUpdateInput,
} from '@/domain/job-role-card/JobRoleCard';

describe('JobRoleCardRepository', () => {
  const mockModel = {
    get: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const buildRepository = () => new JobRoleCardRepository(mockModel);

  it('should get a job role card by id', async () => {
    const mockCard = { id: 'role-123' } as JobRoleCard;
    mockModel.get.mockResolvedValue({ data: mockCard });

    const repo = buildRepository();
    const result = await repo.get('role-123');

    expect(mockModel.get).toHaveBeenCalledWith({ id: 'role-123' }, expect.any(Object));
    expect(result).toEqual(mockCard);
  });

  it('should return null when job role card is not found', async () => {
    mockModel.get.mockResolvedValue({ data: null });

    const repo = buildRepository();
    const result = await repo.get('missing-id');

    expect(result).toBeNull();
  });

  it('should list job role cards', async () => {
    const mockData = [{ id: 'role-1' }] as JobRoleCard[];
    mockModel.list.mockResolvedValue({ data: mockData });

    const repo = buildRepository();
    const result = await repo.list({ filter: 'value' });

    expect(mockModel.list).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toEqual(mockData);
  });

  it('should create a job role card', async () => {
    const input = { id: 'role-create' } as JobRoleCardCreateInput;
    const created = { id: 'role-create' } as JobRoleCard;
    mockModel.create.mockResolvedValue({ data: created });

    const repo = buildRepository();
    const result = await repo.create(input);

    expect(mockModel.create).toHaveBeenCalledWith(input, expect.any(Object));
    expect(result).toEqual(created);
  });

  it('should update a job role card', async () => {
    const input = { id: 'role-update' } as JobRoleCardUpdateInput;
    const updated = { id: 'role-update', name: 'Updated' } as JobRoleCard;
    mockModel.update.mockResolvedValue({ data: updated });

    const repo = buildRepository();
    const result = await repo.update(input);

    expect(mockModel.update).toHaveBeenCalledWith(input, expect.any(Object));
    expect(result).toEqual(updated);
  });

  it('should delete a job role card', async () => {
    mockModel.delete.mockResolvedValue({ data: null });
    const repo = buildRepository();

    await repo.delete('role-delete');

    expect(mockModel.delete).toHaveBeenCalledWith({ id: 'role-delete' }, expect.any(Object));
  });
});
