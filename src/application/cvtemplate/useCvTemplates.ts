import { ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { CVTemplateService } from '@/domain/cvtemplate/CVTemplateService';
import { SYSTEM_CV_TEMPLATES, type SystemCvTemplate } from '@/domain/cvtemplate/systemTemplates';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';

type AuthComposable = {
  userId: { value: string | null };
  loadUserId: () => Promise<void>;
};

type UseCvTemplatesOptions = {
  auth?: AuthComposable;
  service?: CVTemplateService;
};

export function useCvTemplates(options: UseCvTemplatesOptions = {}) {
  const auth = options.auth ?? useAuthUser();
  const service = options.service ?? new CVTemplateService();

  const templates = ref<CVTemplate[]>([]);
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
      templates.value = await service.listForUser(auth.userId.value);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCvTemplates] Failed to load templates:', err);
    } finally {
      loading.value = false;
    }
  };

  const createFromExemplar = async (exemplar: SystemCvTemplate) => {
    if (!auth.userId.value) {
      await auth.loadUserId();
    }
    if (!auth.userId.value) {
      throw new Error('Missing user id');
    }

    const created = await service.createFromExemplar({
      userId: auth.userId.value,
      name: exemplar.name,
      content: exemplar.content,
      source: exemplar.source,
    });

    if (created) {
      templates.value = [created, ...templates.value];
    }

    return created;
  };

  return {
    templates,
    systemTemplates: SYSTEM_CV_TEMPLATES,
    loading,
    error,
    load,
    createFromExemplar,
  };
}
