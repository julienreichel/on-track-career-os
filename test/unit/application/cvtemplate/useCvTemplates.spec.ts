import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useCvTemplates } from '@/application/cvtemplate/useCvTemplates';
import type { CVTemplateService } from '@/domain/cvtemplate/CVTemplateService';

describe('useCvTemplates', () => {
  const auth = {
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  };

  let service: CVTemplateService;

  beforeEach(() => {
    service = {
      listForUser: vi.fn(),
      createFromExemplar: vi.fn(),
    } as unknown as CVTemplateService;
  });

  it('loads templates for the current user', async () => {
    (service.listForUser as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'tpl-1' }]);

    const { templates, load } = useCvTemplates({ auth, service });
    await load();

    expect(service.listForUser).toHaveBeenCalledWith('user-1');
    expect(templates.value).toHaveLength(1);
  });

  it('creates a template from exemplar and prepends it', async () => {
    const created = { id: 'tpl-2' };
    (service.createFromExemplar as ReturnType<typeof vi.fn>).mockResolvedValue(created);

    const { templates, createFromExemplar, systemTemplates } = useCvTemplates({
      auth,
      service,
    });

    await createFromExemplar(systemTemplates[0]!);

    expect(service.createFromExemplar).toHaveBeenCalled();
    expect(templates.value[0]).toEqual(created);
  });
});
