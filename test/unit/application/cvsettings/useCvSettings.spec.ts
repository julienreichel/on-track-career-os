import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useCvSettings } from '@/application/cvsettings/useCvSettings';
import type { CVSettingsService } from '@/domain/cvsettings/CVSettingsService';

describe('useCvSettings', () => {
  const auth = {
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  };

  let service: CVSettingsService;

  beforeEach(() => {
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
  });

  it('saves settings updates', async () => {
    (service.saveSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      userId: 'user-1',
      askEachTime: true,
    });

    const { settings, saveSettings } = useCvSettings({ auth, service });
    await saveSettings({ id: 'user-1', askEachTime: true });

    expect(service.saveSettings).toHaveBeenCalledWith({ id: 'user-1', askEachTime: true });
    expect(settings.value?.askEachTime).toBe(true);
  });
});
