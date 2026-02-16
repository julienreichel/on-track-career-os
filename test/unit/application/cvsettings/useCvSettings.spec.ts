import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { allowConsoleOutput } from '../../../setup/console-guard';
import { useCvSettings } from '@/application/cvsettings/useCvSettings';
import type { CVSettingsService } from '@/domain/cvsettings/CVSettingsService';

describe('useCvSettings', () => {
  const auth = {
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  };

  let service: CVSettingsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = {
      getOrCreate: vi.fn(),
      saveSettings: vi.fn(),
    } as unknown as CVSettingsService;
  });

  it('loads settings via getOrCreate', async () => {
    (service.getOrCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      userId: 'user-1',
    });

    const { settings, load } = useCvSettings({ auth, service });
    await load();

    expect(service.getOrCreate).toHaveBeenCalledWith('user-1');
    expect(settings.value?.id).toBe('user-1');
    expect(settings.value?.defaultDisabledSections).toEqual([]);
  });

  it('saves settings updates', async () => {
    (service.saveSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      userId: 'user-1',
      defaultDisabledSections: ['skills'],
    });

    const { settings, saveSettings } = useCvSettings({ auth, service });
    await saveSettings({ id: 'user-1', defaultDisabledSections: ['skills'] });

    expect(service.saveSettings).toHaveBeenCalledWith({
      id: 'user-1',
      defaultDisabledSections: ['skills'],
    });
    expect(settings.value?.defaultDisabledSections).toEqual(['skills']);
  });

  it('handles load errors gracefully', async () => {
    (service.getOrCreate as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    const { error, load, loading } = useCvSettings({ auth, service });

    await allowConsoleOutput(async () => {
      await load();
    });

    expect(error.value).toBe('Network error');
    expect(loading.value).toBe(false);
  });

  it('loads userId when not available', async () => {
    const authWithoutId = {
      userId: ref(null as string | null),
      loadUserId: vi.fn().mockImplementation(async () => {
        authWithoutId.userId.value = 'user-loaded';
      }),
    };

    (service.getOrCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-loaded',
      userId: 'user-loaded',
    });

    const { load } = useCvSettings({ auth: authWithoutId, service });
    await load();

    expect(authWithoutId.loadUserId).toHaveBeenCalled();
    expect(service.getOrCreate).toHaveBeenCalledWith('user-loaded');
  });

  it('throws error when saving fails', async () => {
    (service.saveSettings as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { saveSettings } = useCvSettings({ auth, service });

    await expect(saveSettings({ id: 'user-1' })).rejects.toThrow('Failed to save CV settings');
  });
});
