import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CVTemplateRepository } from '@/domain/cvtemplate/CVTemplateRepository';

describe('CVTemplateRepository', () => {
  let repository: CVTemplateRepository;
  const model = {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new CVTemplateRepository(model);
  });

  it('creates from exemplar', async () => {
    model.create.mockResolvedValue({ data: { id: 'tpl-1' } });

    const result = await repository.createFromExemplar({
      userId: 'user-1',
      name: 'Classic',
      content: '# CV',
      source: 'system:classic',
    });

    expect(model.create).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        name: 'Classic',
        content: '# CV',
        source: 'system:classic',
      },
      expect.any(Object)
    );
    expect(result?.id).toBe('tpl-1');
  });

  it('gets template by id', async () => {
    model.get.mockResolvedValue({ data: { id: 'tpl-1', name: 'Classic' } });

    const result = await repository.get('tpl-1');

    expect(model.get).toHaveBeenCalledWith({ id: 'tpl-1' }, expect.any(Object));
    expect(result?.id).toBe('tpl-1');
  });

  it('creates template', async () => {
    const input = {
      userId: 'user-1',
      name: 'Custom',
      content: '# Custom CV',
      source: null,
    };
    model.create.mockResolvedValue({ data: { ...input, id: 'tpl-2' } });

    const result = await repository.create(input);

    expect(model.create).toHaveBeenCalledWith(input, expect.any(Object));
    expect(result?.id).toBe('tpl-2');
  });

  it('updates template', async () => {
    const input = {
      id: 'tpl-1',
      name: 'Updated',
      content: '# Updated CV',
    };
    model.update.mockResolvedValue({ data: { ...input } });

    const result = await repository.update(input);

    expect(model.update).toHaveBeenCalledWith(input, expect.any(Object));
    expect(result?.name).toBe('Updated');
  });

  it('deletes template', async () => {
    model.delete.mockResolvedValue({ data: { id: 'tpl-1' } });

    await repository.delete('tpl-1');

    expect(model.delete).toHaveBeenCalledWith({ id: 'tpl-1' }, expect.any(Object));
  });
});
