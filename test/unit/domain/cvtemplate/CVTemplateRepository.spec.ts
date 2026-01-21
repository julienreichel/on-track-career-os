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
});
