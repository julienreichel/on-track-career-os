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
      createFromExemplar: vi.fn(),
    } as unknown as CVTemplateRepository;
    mockUserRepo = {
      getCvTemplatesSnapshot: vi.fn(),
    } as unknown as UserProfileRepository;

    service = new CVTemplateService(mockRepo, mockUserRepo);
  });

  it('lists templates for a user', async () => {
    const templates = [{ id: 'tpl-1' }];
    (mockUserRepo.getCvTemplatesSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue(
      templates
    );

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
});
