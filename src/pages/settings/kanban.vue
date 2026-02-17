<script setup lang="ts">
import { useKanbanSettings } from '@/application/kanban-settings/useKanbanSettings';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';
import ErrorStateCard from '@/components/common/ErrorStateCard.vue';
import KanbanStageListEditorCard from '@/components/settings/KanbanStageListEditorCard.vue';
import { ensureSystemStages } from '@/domain/kanban-settings/kanbanStages';
import { useErrorDisplay } from '@/composables/useErrorDisplay';

defineOptions({ name: 'KanbanSettingsPage' });

const { t } = useI18n();
const toast = useToast();
const kanbanSettings = useKanbanSettings();
const { pageError, pageErrorMessageKey, setPageError, clearPageError, notifyActionError } =
  useErrorDisplay();
const saving = ref(false);

const editableStages = ref<KanbanStage[]>([]);

const isLoading = computed(() => kanbanSettings.state.isLoading.value || saving.value);

const syncStages = (stages: ReadonlyArray<KanbanStage>) => {
  editableStages.value = ensureSystemStages(stages);
};

const load = async () => {
  clearPageError();
  try {
    const stages = await kanbanSettings.load();
    syncStages(stages);
  } catch (err) {
    setPageError(
      err instanceof Error ? err.message : t('settings.kanban.errors.load'),
      'settings.kanban.errors.load'
    );
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const saved = await kanbanSettings.save(editableStages.value);
    syncStages(saved);
    toast.add({
      title: t('settings.kanban.toast.saved'),
      color: 'primary',
    });
  } catch {
    notifyActionError({
      title: t('settings.kanban.toast.saveFailed'),
    });
  } finally {
    saving.value = false;
  }
};

const handleStagesUpdate = (nextStages: KanbanStage[]) => {
  syncStages(nextStages);
};

onMounted(() => {
  void load();
});
</script>

<template>
  <UPage>
    <UPageHeader
      :title="t('settings.kanban.title')"
      :description="t('settings.kanban.description')"
      :links="[
        {
          label: t('settings.title'),
          icon: 'i-heroicons-arrow-left',
          to: '/settings',
        },
      ]"
    />
    <UPageBody>
      <ErrorStateCard
        v-if="pageError"
        :title="t('common.error')"
        :description="t(pageErrorMessageKey || 'settings.kanban.errors.load')"
        :retry-label="t('common.retry')"
        @retry="load"
      />

      <div v-else class="space-y-4">
        <KanbanStageListEditorCard
          :stages="editableStages"
          :disabled="isLoading"
          @update:stages="handleStagesUpdate"
        />

        <div class="flex justify-end">
          <UButton
            color="primary"
            :label="t('common.actions.save')"
            :loading="saving"
            :disabled="isLoading"
            data-testid="kanban-settings-save"
            @click="handleSave"
          />
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>
