import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import { useCvTemplates } from '@/application/cvtemplate/useCvTemplates';
import type { CVTemplateService } from '@/domain/cvtemplate/CVTemplateService';

describe('useCvTemplates', () => {
  const i18n = createTestI18n();
  const auth = {
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  };

  let service: CVTemplateService;

  beforeEach(() => {
    service = {
      listForUser: vi.fn(),
      createFromExemplar: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as CVTemplateService;
  });

  it('loads templates for the current user', async () => {
    (service.listForUser as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'tpl-1', source: 'system:classic' },
    ]);

    const { templates, load } = useCvTemplates({
      auth,
      service,
      i18n: { t: i18n.global.t, locale: i18n.global.locale },
    });
    await load();

    expect(service.listForUser).toHaveBeenCalledWith('user-1');
    expect(templates.value.length).toBeGreaterThanOrEqual(3);
    expect(templates.value.some((template) => template.id === 'tpl-1')).toBe(true);
  });

  it('creates a template from exemplar and prepends it', async () => {
    const created = { id: 'tpl-2' };
    (service.createFromExemplar as ReturnType<typeof vi.fn>).mockResolvedValue(created);

    const { templates, createFromExemplar, systemTemplates } = useCvTemplates({
      auth,
      service,
      i18n: { t: i18n.global.t, locale: i18n.global.locale },
    });

    await createFromExemplar(systemTemplates.value[0]!);

    expect(service.createFromExemplar).toHaveBeenCalled();
    expect(templates.value.some((template) => template.id === created.id)).toBe(true);
  });
});
