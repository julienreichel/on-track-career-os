import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { allowConsoleOutput } from '../../../setup/console-guard';
import { createTestI18n } from '../../../utils/createTestI18n';
import { useCvTemplates } from '@/application/cvtemplate/useCvTemplates';
import type { CVTemplateService } from '@/domain/cvtemplate/CVTemplateService';

vi.mock('@/composables/useAnalytics', () => ({
  useAnalytics: () => ({
    captureEvent: vi.fn(),
  }),
}));

describe('useCvTemplates', () => {
  const i18n = createTestI18n();
  const auth = {
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  };

  let service: CVTemplateService;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('handles load errors gracefully', async () => {
    (service.listForUser as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    const { error, load, loading } = useCvTemplates({
      auth,
      service,
      i18n: { t: i18n.global.t, locale: i18n.global.locale },
    });

    await allowConsoleOutput(async () => {
      await load();
    });

    expect(error.value).toBe('Network error');
    expect(loading.value).toBe(false);
  });

  it('creates custom template and prepends it', async () => {
    const created = { id: 'tpl-custom', name: 'Custom', content: 'test' };
    (service.create as ReturnType<typeof vi.fn>).mockResolvedValue(created);

    const { templates, createTemplate } = useCvTemplates({
      auth,
      service,
      i18n: { t: i18n.global.t, locale: i18n.global.locale },
    });

    await createTemplate({ name: 'Custom', content: 'test', source: null });

    expect(service.create).toHaveBeenCalledWith({
      name: 'Custom',
      content: 'test',
      source: null,
      userId: 'user-1',
    });
    expect(templates.value.some((template) => template.id === 'tpl-custom')).toBe(true);
  });

  it('updates template in the list', async () => {
    const initial = { id: 'tpl-1', name: 'Old', content: 'old' };
    const updated = { id: 'tpl-1', name: 'New', content: 'new' };
    (service.listForUser as ReturnType<typeof vi.fn>).mockResolvedValue([initial]);
    (service.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const { templates, load, updateTemplate } = useCvTemplates({
      auth,
      service,
      i18n: { t: i18n.global.t, locale: i18n.global.locale },
    });

    await load();
    await updateTemplate({ id: 'tpl-1', name: 'New', content: 'new' });

    const template = templates.value.find((t) => t.id === 'tpl-1');
    expect(template?.name).toBe('New');
  });

  it('deletes template from the list', async () => {
    const initial = [{ id: 'tpl-1' }, { id: 'tpl-2' }];
    (service.listForUser as ReturnType<typeof vi.fn>).mockResolvedValue(initial);
    (service.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { templates, load, deleteTemplate } = useCvTemplates({
      auth,
      service,
      i18n: { t: i18n.global.t, locale: i18n.global.locale },
    });

    await load();
    await deleteTemplate('tpl-1');

    expect(service.delete).toHaveBeenCalledWith('tpl-1');
    expect(templates.value.some((t) => t.id === 'tpl-1')).toBe(false);
    expect(templates.value.some((t) => t.id === 'tpl-2')).toBe(true);
  });

  it('loads userId when not available', async () => {
    const authWithoutId = {
      userId: ref(null as string | null),
      loadUserId: vi.fn().mockImplementation(async () => {
        authWithoutId.userId.value = 'user-loaded';
      }),
    };

    (service.listForUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const { load } = useCvTemplates({
      auth: authWithoutId,
      service,
      i18n: { t: i18n.global.t, locale: i18n.global.locale },
    });

    await load();

    expect(authWithoutId.loadUserId).toHaveBeenCalled();
    expect(service.listForUser).toHaveBeenCalledWith('user-loaded');
  });

  it('throws error when userId cannot be loaded', async () => {
    const authWithoutId = {
      userId: ref(null as string | null),
      loadUserId: vi.fn(),
    };

    const { createTemplate } = useCvTemplates({
      auth: authWithoutId,
      service,
      i18n: { t: i18n.global.t, locale: i18n.global.locale },
    });

    await expect(createTemplate({ name: 'Test', content: 'test', source: null })).rejects.toThrow(
      'Missing user id'
    );
  });
});
