<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CanvasBlockSection from './CanvasBlockSection.vue';
import { COMPANY_CANVAS_UI_BLOCKS } from './canvasBlocksConfig';
import type { CompanyCanvasBlockKey } from '@/domain/company-canvas/canvasBlocks';

interface Props {
  blocks: Record<CompanyCanvasBlockKey, string[]>;
  summary: string;
  needsUpdate?: boolean;
  lastGeneratedAt?: string | null;
  saving?: boolean;
  regenerating?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  needsUpdate: false,
  lastGeneratedAt: null,
  saving: false,
  regenerating: false,
  disabled: false,
});

const emit = defineEmits<{
  'update:block': [CompanyCanvasBlockKey, string[]];
  'update:summary': [string];
  save: [];
  regenerate: [];
}>();

const { t } = useI18n();

const blockSections = computed(() =>
  COMPANY_CANVAS_UI_BLOCKS.map((block) => ({
    ...block,
    label: t(block.labelKey),
    hint: t(block.hintKey),
  }))
);

const formattedLastGeneratedAt = computed(() => {
  if (!props.lastGeneratedAt) {
    return t('companies.canvas.lastGeneratedUnknown');
  }
  const date = new Date(props.lastGeneratedAt);
  if (Number.isNaN(date.getTime())) {
    return props.lastGeneratedAt;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
});

const summaryPlaceholder = computed(() =>
  t('companies.canvas.summary.placeholder')
);

const handleSummaryUpdate = (event: Event) => {
  const value = (event.target as HTMLTextAreaElement).value;
  emit('update:summary', value);
};
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold">
          {{ t('companies.canvas.title') }}
        </h2>
        <p class="text-sm text-gray-500">
          {{ t('companies.canvas.description') }}
        </p>
      </div>
      <div class="flex flex-wrap gap-3 text-sm text-gray-500">
        <UBadge :color="needsUpdate ? 'warning' : 'success'" variant="soft">
          {{
            needsUpdate
              ? t('companies.canvas.status.needsUpdate')
              : t('companies.canvas.status.upToDate')
          }}
        </UBadge>
        <span>
          {{ t('companies.canvas.lastGeneratedAt', { date: formattedLastGeneratedAt }) }}
        </span>
      </div>
    </header>

    <div class="grid gap-4 md:grid-cols-2">
      <CanvasBlockSection
        v-for="block in blockSections"
        :key="block.key"
        :label="block.label"
        :hint="block.hint"
        :model-value="blocks[block.key] ?? []"
        :disabled="disabled || saving || regenerating"
        @update:model-value="(value) => emit('update:block', block.key, value)"
      />
    </div>

    <UFormField
      :label="t('companies.canvas.summary.label')"
      :hint="t('companies.canvas.summary.hint')"
    >
      <UTextarea
        :value="summary"
        :placeholder="summaryPlaceholder"
        :disabled="disabled || saving || regenerating"
        class="w-full"
        @input="handleSummaryUpdate"
      />
    </UFormField>

    <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <UButton
        color="secondary"
        icon="i-heroicons-sparkles"
        :label="t('companies.canvas.actions.generate')"
        :loading="regenerating"
        :disabled="saving"
        @click="emit('regenerate')"
      />
      <UButton
        color="primary"
        icon="i-heroicons-document-check"
        :label="t('companies.canvas.actions.save')"
        :loading="saving"
        :disabled="regenerating"
        @click="emit('save')"
      />
    </div>
  </section>
</template>
