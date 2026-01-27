<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CanvasBlockSection from './CanvasBlockSection.vue';
import type { CompanyCanvasBlockKey } from '@/domain/company-canvas/canvasBlocks';

interface Props {
  blocks: Record<CompanyCanvasBlockKey, string[]>;
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
  save: [];
  regenerate: [];
}>();

const { t } = useI18n();
const isEditing = ref(false);
const disableEdit = computed(() => props.disabled || props.regenerating || props.saving);

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
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-xl font-semibold">
            {{ t('companies.canvas.title') }}
          </h2>
          <p class="text-sm text-gray-500">
            {{ t('companies.canvas.description') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3 text-sm text-gray-500">
          <UBadge
            :color="needsUpdate ? 'warning' : 'secondary'"
            variant="outline"
            :icon="
              needsUpdate ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'
            "
          >
            {{
              needsUpdate
                ? t('companies.canvas.status.needsUpdate')
                : t('companies.canvas.status.upToDate')
            }}
          </UBadge>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Top Section: 5 columns (Business Model Canvas Layout) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Key Partners (1 col) -->
        <CanvasBlockSection
          test-id="canvas-keyPartners"
          :label="t('companies.canvas.blocks.keyPartners.label')"
          :hint="t('companies.canvas.blocks.keyPartners.hint')"
          :model-value="blocks.keyPartners ?? []"
          :disabled="disabled || saving || regenerating"
          :read-only="!isEditing"
          :empty-label="t('common.notAvailable')"
          @update:model-value="(value) => emit('update:block', 'keyPartners', value)"
        />

        <!-- Key Activities & Key Resources (1 col, stacked) -->
        <div class="flex flex-col space-y-4">
          <CanvasBlockSection
            test-id="canvas-keyActivities"
            :label="t('companies.canvas.blocks.keyActivities.label')"
            :hint="t('companies.canvas.blocks.keyActivities.hint')"
            :model-value="blocks.keyActivities ?? []"
            :disabled="disabled || saving || regenerating"
            :read-only="!isEditing"
            :empty-label="t('common.notAvailable')"
            @update:model-value="(value) => emit('update:block', 'keyActivities', value)"
          />
          <CanvasBlockSection
            test-id="canvas-keyResources"
            :label="t('companies.canvas.blocks.keyResources.label')"
            :hint="t('companies.canvas.blocks.keyResources.hint')"
            :model-value="blocks.keyResources ?? []"
            :disabled="disabled || saving || regenerating"
            :read-only="!isEditing"
            :empty-label="t('common.notAvailable')"
            @update:model-value="(value) => emit('update:block', 'keyResources', value)"
          />
        </div>

        <!-- Value Propositions (1 col, center) -->
        <CanvasBlockSection
          test-id="canvas-valuePropositions"
          :label="t('companies.canvas.blocks.valuePropositions.label')"
          :hint="t('companies.canvas.blocks.valuePropositions.hint')"
          :model-value="blocks.valuePropositions ?? []"
          :disabled="disabled || saving || regenerating"
          :read-only="!isEditing"
          :empty-label="t('common.notAvailable')"
          @update:model-value="(value) => emit('update:block', 'valuePropositions', value)"
        />

        <!-- Customer Relationships & Channels (1 col, stacked) -->
        <div class="flex flex-col space-y-4">
          <CanvasBlockSection
            test-id="canvas-customerRelationships"
            :label="t('companies.canvas.blocks.customerRelationships.label')"
            :hint="t('companies.canvas.blocks.customerRelationships.hint')"
            :model-value="blocks.customerRelationships ?? []"
            :disabled="disabled || saving || regenerating"
            :read-only="!isEditing"
            :empty-label="t('common.notAvailable')"
            @update:model-value="(value) => emit('update:block', 'customerRelationships', value)"
          />
          <CanvasBlockSection
            test-id="canvas-channels"
            :label="t('companies.canvas.blocks.channels.label')"
            :hint="t('companies.canvas.blocks.channels.hint')"
            :model-value="blocks.channels ?? []"
            :disabled="disabled || saving || regenerating"
            :read-only="!isEditing"
            :empty-label="t('common.notAvailable')"
            @update:model-value="(value) => emit('update:block', 'channels', value)"
          />
        </div>

        <!-- Customer Segments (1 col) -->
        <CanvasBlockSection
          test-id="canvas-customerSegments"
          :label="t('companies.canvas.blocks.customerSegments.label')"
          :hint="t('companies.canvas.blocks.customerSegments.hint')"
          :model-value="blocks.customerSegments ?? []"
          :disabled="disabled || saving || regenerating"
          :read-only="!isEditing"
          :empty-label="t('common.notAvailable')"
          @update:model-value="(value) => emit('update:block', 'customerSegments', value)"
        />
      </div>

      <!-- Bottom Section: Cost Structure & Revenue Streams -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CanvasBlockSection
          test-id="canvas-costStructure"
          :label="t('companies.canvas.blocks.costStructure.label')"
          :hint="t('companies.canvas.blocks.costStructure.hint')"
          :model-value="blocks.costStructure ?? []"
          :disabled="disabled || saving || regenerating"
          :read-only="!isEditing"
          :empty-label="t('common.notAvailable')"
          @update:model-value="(value) => emit('update:block', 'costStructure', value)"
        />
        <CanvasBlockSection
          test-id="canvas-revenueStreams"
          :label="t('companies.canvas.blocks.revenueStreams.label')"
          :hint="t('companies.canvas.blocks.revenueStreams.hint')"
          :model-value="blocks.revenueStreams ?? []"
          :disabled="disabled || saving || regenerating"
          :read-only="!isEditing"
          :empty-label="t('common.notAvailable')"
          @update:model-value="(value) => emit('update:block', 'revenueStreams', value)"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs text-gray-400">
          {{ t('companies.canvas.lastGeneratedAt', { date: formattedLastGeneratedAt }) }}
        </p>
        <div class="flex flex-wrap justify-end gap-3">
          <UButton
            color="secondary"
            icon="i-heroicons-sparkles"
            :label="t('companies.canvas.actions.generate')"
            :loading="regenerating"
            :disabled="saving"
            @click="emit('regenerate')"
          />
          <template v-if="isEditing">
            <UButton
              color="neutral"
              variant="ghost"
              :label="t('common.cancel')"
              :disabled="disableEdit"
              @click="isEditing = false"
            />
            <UButton
              color="primary"
              icon="i-heroicons-check"
              :label="t('companies.canvas.actions.save')"
              :loading="saving"
              :disabled="regenerating"
              @click="emit('save')"
            />
          </template>
          <UButton
            v-else
            color="primary"
            variant="outline"
            icon="i-heroicons-pencil"
            :label="t('common.edit')"
            :disabled="disableEdit"
            data-testid="company-canvas-edit"
            @click="isEditing = true"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
