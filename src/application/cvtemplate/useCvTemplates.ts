import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { CVTemplateService } from '@/domain/cvtemplate/CVTemplateService';
import { useAnalytics } from '@/composables/useAnalytics';
import {
  resolveSystemCvTemplates,
  type SystemCvTemplate,
} from '@/domain/cvtemplate/systemTemplates';
import type {
  CVTemplate,
  CVTemplateCreateInput,
  CVTemplateUpdateInput,
} from '@/domain/cvtemplate/CVTemplate';

type AuthComposable = {
  userId: { value: string | null };
  loadUserId: () => Promise<void>;
};

type UseCvTemplatesOptions = {
  auth?: AuthComposable;
  service?: CVTemplateService;
  i18n?: {
    t: (key: string) => string;
    locale: { value: string };
  };
};

export function useCvTemplates(options: UseCvTemplatesOptions = {}) {
  const auth = options.auth ?? useAuthUser();
  const service = options.service ?? new CVTemplateService();
  const i18n = options.i18n ?? useI18n();

  const templates = ref<CVTemplate[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const systemTemplates = computed(() => resolveSystemCvTemplates(i18n.locale.value, i18n.t));

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

  const createTemplate = async (input: Omit<CVTemplateCreateInput, 'userId'>) => {
    if (!auth.userId.value) {
      await auth.loadUserId();
    }
    if (!auth.userId.value) {
      throw new Error('Missing user id');
    }

    const created = await service.create({
      ...input,
      userId: auth.userId.value,
    });

    if (created) {
      templates.value = [created, ...templates.value];
      const { captureEvent } = useAnalytics();
      captureEvent('cv_template_created');
    }

    return created;
  };

  const updateTemplate = async (input: CVTemplateUpdateInput) => {
    const updated = await service.update(input);
    if (updated) {
      templates.value = templates.value.map((template) =>
        template.id === updated.id ? updated : template
      );
    }
    return updated;
  };

  const deleteTemplate = async (id: string) => {
    await service.delete(id);
    templates.value = templates.value.filter((template) => template.id !== id);
  };

  return {
    templates,
    systemTemplates,
    loading,
    error,
    load,
    createFromExemplar,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
