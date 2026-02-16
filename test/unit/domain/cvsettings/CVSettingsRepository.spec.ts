import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CVSettingsRepository } from '@/domain/cvsettings/CVSettingsRepository';

describe('CVSettingsRepository', () => {
  let repository: CVSettingsRepository;
  const model = {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new CVSettingsRepository(model);
  });

  it('returns existing settings from getOrCreate', async () => {
    model.get.mockResolvedValue({ data: { id: 'user-1', userId: 'user-1' } });

    const result = await repository.getOrCreate('user-1');

    expect(model.get).toHaveBeenCalled();
    expect(model.create).not.toHaveBeenCalled();
    expect(result?.id).toBe('user-1');
  });

  it('creates settings when missing', async () => {
    model.get.mockResolvedValue({ data: null });
    model.create.mockResolvedValue({ data: { id: 'user-1', userId: 'user-1' } });

    const result = await repository.getOrCreate('user-1');

    expect(model.create).toHaveBeenCalledWith(
      { id: 'user-1', userId: 'user-1' },
      expect.any(Object)
    );
    expect(result?.id).toBe('user-1');
  });

  it('throws error when userId is empty', async () => {
    await expect(repository.getOrCreate('')).rejects.toThrow('userId is required');
  });

  it('gets settings by id', async () => {
    model.get.mockResolvedValue({ data: { id: 'user-1', userId: 'user-1' } });

    const result = await repository.get('user-1');

    expect(model.get).toHaveBeenCalledWith({ id: 'user-1' }, expect.any(Object));
    expect(result?.id).toBe('user-1');
  });

  it('creates settings', async () => {
    const input = { id: 'user-1', userId: 'user-1' };
    model.create.mockResolvedValue({ data: input });

    const result = await repository.create(input);

    expect(model.create).toHaveBeenCalledWith(input, expect.any(Object));
    expect(result?.id).toBe('user-1');
  });

  it('updates settings', async () => {
    const input = { id: 'user-1', preferredLanguage: 'fr' };
    model.update.mockResolvedValue({ data: input });

    const result = await repository.update(input);

    expect(model.update).toHaveBeenCalledWith(input, expect.any(Object));
    expect(result).toEqual(input);
  });

  it('deletes settings', async () => {
    model.delete.mockResolvedValue({ data: null });

    await repository.delete('user-1');

    expect(model.delete).toHaveBeenCalledWith({ id: 'user-1' }, expect.any(Object));
  });
});
