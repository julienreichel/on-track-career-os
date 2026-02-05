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

export type CvTemplateListItem = Omit<CVTemplate, 'user'> & {
  user?: CVTemplate['user'] | null;
  isSystemTemplate?: boolean;
  description?: string;
};

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

const ensureUserId = async (auth: AuthComposable): Promise<string> => {
  if (!auth.userId.value) {
    await auth.loadUserId();
  }
  if (!auth.userId.value) {
    throw new Error('Missing user id');
  }
  return auth.userId.value;
};

const buildFallbackTemplates = (
  systemTemplates: SystemCvTemplate[],
  userTemplates: CVTemplate[],
  userId: string | null
): CvTemplateListItem[] => {
  const sources = new Set(
    userTemplates.map((template) => template.source).filter(Boolean) as string[]
  );
  return systemTemplates
    .filter((template) => !sources.has(template.id))
    .map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      content: template.content,
      source: template.source,
      userId: userId ?? 'system',
      createdAt: '',
      updatedAt: '',
      isSystemTemplate: true,
    }));
};

const mergeTemplates = (
  userTemplates: CVTemplate[],
  fallbackTemplates: CvTemplateListItem[]
): CvTemplateListItem[] => [
  ...userTemplates.map((template) => ({ ...template, isSystemTemplate: false })),
  ...fallbackTemplates,
];

export function useCvTemplates(options: UseCvTemplatesOptions = {}) {
  const auth = options.auth ?? useAuthUser();
  const service = options.service ?? new CVTemplateService();
  const i18n = options.i18n ?? useI18n();

  const userTemplates = ref<CVTemplate[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const systemTemplates = computed(() => resolveSystemCvTemplates(i18n.locale.value, i18n.t));
  const templates = computed<CvTemplateListItem[]>(() => {
    const fallbackTemplates = buildFallbackTemplates(
      systemTemplates.value,
      userTemplates.value,
      auth.userId.value
    );
    return mergeTemplates(userTemplates.value, fallbackTemplates);
  });

  const load = async () => {
    loading.value = true;
    error.value = null;

    try {
      const userId = await ensureUserId(auth);
      userTemplates.value = await service.listForUser(userId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCvTemplates] Failed to load templates:', err);
    } finally {
      loading.value = false;
    }
  };

  const createFromExemplar = async (exemplar: SystemCvTemplate) => {
    const userId = await ensureUserId(auth);
    const created = await service.createFromExemplar({
      userId,
      name: exemplar.name,
      content: exemplar.content,
      source: exemplar.source,
    });

    if (created) {
      userTemplates.value = [created, ...userTemplates.value];
    }

    return created;
  };

  const createTemplate = async (input: Omit<CVTemplateCreateInput, 'userId'>) => {
    const userId = await ensureUserId(auth);
    const created = await service.create({
      ...input,
      userId,
    });

    if (created) {
      userTemplates.value = [created, ...userTemplates.value];
      const { captureEvent } = useAnalytics();
      captureEvent('cv_template_created');
    }

    return created;
  };

  const updateTemplate = async (input: CVTemplateUpdateInput) => {
    const updated = await service.update(input);
    if (updated) {
      userTemplates.value = userTemplates.value.map((template) =>
        template.id === updated.id ? updated : template
      );
    }
    return updated;
  };

  const deleteTemplate = async (id: string) => {
    await service.delete(id);
    userTemplates.value = userTemplates.value.filter((template) => template.id !== id);
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
