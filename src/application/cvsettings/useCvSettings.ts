import { ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { CVSettingsService } from '@/domain/cvsettings/CVSettingsService';
import type { CVSettings, CVSettingsUpdateInput } from '@/domain/cvsettings/CVSettings';

type AuthComposable = {
  userId: { value: string | null };
  loadUserId: () => Promise<void>;
};

type UseCvSettingsOptions = {
  auth?: AuthComposable;
  service?: CVSettingsService;
};

export function useCvSettings(options: UseCvSettingsOptions = {}) {
  const auth = options.auth ?? useAuthUser();
  const service = options.service ?? new CVSettingsService();

  const settings = ref<CVSettings | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const load = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (!auth.userId.value) {
        await auth.loadUserId();
      }
      if (!auth.userId.value) {
        throw new Error('Missing user id');
      }
      settings.value = await service.getOrCreate(auth.userId.value);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCvSettings] Failed to load settings:', err);
    } finally {
      loading.value = false;
    }
  };

  const saveSettings = async (input: CVSettingsUpdateInput) => {
    settings.value = await service.saveSettings(input);
    return settings.value;
  };

  return {
    settings,
    loading,
    error,
    load,
    saveSettings,
  };
}
