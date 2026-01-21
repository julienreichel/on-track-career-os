import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CVSettingsService } from '@/domain/cvsettings/CVSettingsService';
import type { CVSettingsRepository } from '@/domain/cvsettings/CVSettingsRepository';
import type { CVSettings } from '@/domain/cvsettings/CVSettings';

describe('CVSettingsService', () => {
  let service: CVSettingsService;
  let mockRepository: CVSettingsRepository;

  beforeEach(() => {
    mockRepository = {
      getOrCreate: vi.fn(),
      update: vi.fn(),
    } as unknown as CVSettingsRepository;

    service = new CVSettingsService(mockRepository);
  });

  it('returns settings from getOrCreate', async () => {
    const settings = { id: 'user-1', userId: 'user-1' } as CVSettings;
    (mockRepository.getOrCreate as ReturnType<typeof vi.fn>).mockResolvedValue(settings);

    const result = await service.getOrCreate('user-1');

    expect(mockRepository.getOrCreate).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(settings);
  });

  it('updates settings via saveSettings', async () => {
    const updated = { id: 'user-1', userId: 'user-1', askEachTime: true } as CVSettings;
    (mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await service.saveSettings({ id: 'user-1', askEachTime: true });

    expect(mockRepository.update).toHaveBeenCalledWith({ id: 'user-1', askEachTime: true });
    expect(result).toEqual(updated);
  });
});
