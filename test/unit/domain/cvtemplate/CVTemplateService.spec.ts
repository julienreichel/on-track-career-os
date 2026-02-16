import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CVTemplateService } from '@/domain/cvtemplate/CVTemplateService';
import type { CVTemplateRepository } from '@/domain/cvtemplate/CVTemplateRepository';
import type { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';

describe('CVTemplateService', () => {
  let service: CVTemplateService;
  let mockRepo: CVTemplateRepository;
  let mockUserRepo: UserProfileRepository;

  beforeEach(() => {
    mockRepo = {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createFromExemplar: vi.fn(),
    } as unknown as CVTemplateRepository;
    mockUserRepo = {
      getCvTemplatesSnapshot: vi.fn(),
    } as unknown as UserProfileRepository;

    service = new CVTemplateService(mockRepo, mockUserRepo);
  });

  it('lists templates for a user', async () => {
    const templates = [{ id: 'tpl-1' }];
    (mockUserRepo.getCvTemplatesSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue(templates);

    const result = await service.listForUser('user-1');

    expect(mockUserRepo.getCvTemplatesSnapshot).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(templates);
  });

  it('creates template from exemplar', async () => {
    const created = { id: 'tpl-2' };
    (mockRepo.createFromExemplar as ReturnType<typeof vi.fn>).mockResolvedValue(created);

    const result = await service.createFromExemplar({
      userId: 'user-1',
      name: 'Classic',
      content: '# CV',
      source: 'system:classic',
    });

    expect(mockRepo.createFromExemplar).toHaveBeenCalled();
    expect(result).toEqual(created);
  });

  it('gets template by id', async () => {
    const template = { id: 'tpl-1', name: 'Classic' };
    (mockRepo.get as ReturnType<typeof vi.fn>).mockResolvedValue(template);

    const result = await service.get('tpl-1');

    expect(mockRepo.get).toHaveBeenCalledWith('tpl-1');
    expect(result).toEqual(template);
  });

  it('creates custom template', async () => {
    const input = {
      userId: 'user-1',
      name: 'Custom',
      content: '# Custom',
      source: null,
    };
    const created = { ...input, id: 'tpl-3' };
    (mockRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(created);

    const result = await service.create(input);

    expect(mockRepo.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(created);
  });

  it('updates template', async () => {
    const input = { id: 'tpl-1', name: 'Updated' };
    const updated = { ...input, content: '# Content' };
    (mockRepo.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await service.update(input);

    expect(mockRepo.update).toHaveBeenCalledWith(input);
    expect(result).toEqual(updated);
  });

  it('deletes template', async () => {
    (mockRepo.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await service.delete('tpl-1');

    expect(mockRepo.delete).toHaveBeenCalledWith('tpl-1');
  });
});
