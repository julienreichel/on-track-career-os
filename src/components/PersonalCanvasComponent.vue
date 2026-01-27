<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <UCard v-else-if="!canvas" class="text-center py-12">
      <template #header>
        <h3 class="text-lg font-semibold">{{ t('canvas.empty.title') }}</h3>
      </template>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ t('canvas.empty.description') }}
      </p>
      <UButton icon="i-heroicons-sparkles" size="lg" @click="$emit('generate')">
        {{ t('canvas.actions.generate') }}
      </UButton>
    </UCard>

    <!-- Canvas Grid - Business Model Canvas Layout -->
    <div v-else class="space-y-4">
      <!-- Top Section: 5 columns -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
        <!-- Key Partners (1 col) -->
        <div class="flex w-full">
          <CanvasSectionCard
            class="w-full"
            icon="i-heroicons-users"
            :title="t('canvas.sections.keyPartners')"
            :items="canvas.keyPartners"
            :is-editing="editingSection === 'keyPartners'"
            :placeholder="t('canvas.placeholders.keyPartners')"
            :empty-text="t('canvas.empty.field')"
            @edit="startEditingSection('keyPartners')"
            @update:items="updateSection('keyPartners', $event)"
            @save="saveSectionChanges('keyPartners')"
            @cancel="cancelEditingSection"
          />
        </div>

        <!-- Key Activities & Key Resources (1 col, stacked) -->
        <div class="flex flex-col space-y-4 w-full">
          <div class="flex flex-1 w-full">
            <CanvasSectionCard
              class="w-full"
              icon="i-heroicons-cog-6-tooth"
              :title="t('canvas.sections.keyActivities')"
              :items="canvas.keyActivities"
              :is-editing="editingSection === 'keyActivities'"
              :placeholder="t('canvas.placeholders.keyActivities')"
              :empty-text="t('canvas.empty.field')"
              @edit="startEditingSection('keyActivities')"
              @update:items="updateSection('keyActivities', $event)"
              @save="saveSectionChanges('keyActivities')"
              @cancel="cancelEditingSection"
            />
          </div>
          <div class="flex flex-1 w-full">
            <CanvasSectionCard
              class="w-full"
              icon="i-heroicons-cube"
              :title="t('canvas.sections.keyResources')"
              :items="canvas.keyResources"
              :is-editing="editingSection === 'keyResources'"
              :placeholder="t('canvas.placeholders.keyResources')"
              :empty-text="t('canvas.empty.field')"
              @edit="startEditingSection('keyResources')"
              @update:items="updateSection('keyResources', $event)"
              @save="saveSectionChanges('keyResources')"
              @cancel="cancelEditingSection"
            />
          </div>
        </div>

        <!-- Value Proposition (1 col, center) -->
        <div class="flex w-full">
          <CanvasSectionCard
            class="w-full"
            icon="i-heroicons-light-bulb"
            :title="t('canvas.sections.valueProposition')"
            :items="canvas.valueProposition"
            :is-editing="editingSection === 'valueProposition'"
            :placeholder="t('canvas.placeholders.valueProposition')"
            :empty-text="t('canvas.empty.field')"
            @edit="startEditingSection('valueProposition')"
            @update:items="updateSection('valueProposition', $event)"
            @save="saveSectionChanges('valueProposition')"
            @cancel="cancelEditingSection"
          />
        </div>

        <!-- Customer Relationships & Channels (1 col, stacked) -->
        <div class="flex flex-col space-y-4 w-full">
          <div class="flex flex-1 w-full">
            <CanvasSectionCard
              class="w-full"
              icon="i-heroicons-heart"
              :title="t('canvas.sections.customerRelationships')"
              :items="canvas.customerRelationships"
              :is-editing="editingSection === 'customerRelationships'"
              :placeholder="t('canvas.placeholders.customerRelationships')"
              :empty-text="t('canvas.empty.field')"
              @edit="startEditingSection('customerRelationships')"
              @update:items="updateSection('customerRelationships', $event)"
              @save="saveSectionChanges('customerRelationships')"
              @cancel="cancelEditingSection"
            />
          </div>
          <div class="flex flex-1 w-full">
            <CanvasSectionCard
              class="w-full"
              icon="i-heroicons-megaphone"
              :title="t('canvas.sections.channels')"
              :items="canvas.channels"
              :is-editing="editingSection === 'channels'"
              :placeholder="t('canvas.placeholders.channels')"
              :empty-text="t('canvas.empty.field')"
              @edit="startEditingSection('channels')"
              @update:items="updateSection('channels', $event)"
              @save="saveSectionChanges('channels')"
              @cancel="cancelEditingSection"
            />
          </div>
        </div>

        <!-- Customer Segments (1 col) -->
        <div class="flex w-full">
          <CanvasSectionCard
            class="w-full"
            icon="i-heroicons-user-group"
            :title="t('canvas.sections.customerSegments')"
            :items="canvas.customerSegments"
            :is-editing="editingSection === 'customerSegments'"
            :placeholder="t('canvas.placeholders.customerSegments')"
            :empty-text="t('canvas.empty.field')"
            @edit="startEditingSection('customerSegments')"
            @update:items="updateSection('customerSegments', $event)"
            @save="saveSectionChanges('customerSegments')"
            @cancel="cancelEditingSection"
          />
        </div>
      </div>

      <!-- Bottom Section: 2 columns (Cost Structure & Revenue Streams) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <!-- Cost Structure (left half) -->
        <div class="flex w-full">
          <CanvasSectionCard
            class="w-full"
            icon="i-heroicons-currency-dollar"
            :title="t('canvas.sections.costStructure')"
            :items="canvas.costStructure"
            :is-editing="editingSection === 'costStructure'"
            :placeholder="t('canvas.placeholders.costStructure')"
            :empty-text="t('canvas.empty.field')"
            @edit="startEditingSection('costStructure')"
            @update:items="updateSection('costStructure', $event)"
            @save="saveSectionChanges('costStructure')"
            @cancel="cancelEditingSection"
          />
        </div>

        <!-- Revenue Streams (right half) -->
        <div class="flex w-full">
          <CanvasSectionCard
            class="w-full"
            icon="i-heroicons-banknotes"
            :title="t('canvas.sections.revenueStreams')"
            :items="canvas.revenueStreams"
            :is-editing="editingSection === 'revenueStreams'"
            :placeholder="t('canvas.placeholders.revenueStreams')"
            :empty-text="t('canvas.empty.field')"
            @edit="startEditingSection('revenueStreams')"
            @update:items="updateSection('revenueStreams', $event)"
            @save="saveSectionChanges('revenueStreams')"
            @cancel="cancelEditingSection"
          />
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="canvas && !loading" class="flex items-center justify-between pt-4 border-t">
      <UBadge
        v-if="canvas.needsUpdate"
        color="warning"
        variant="outline"
        icon="i-heroicons-exclamation-triangle"
      >
        {{ t('canvas.needsUpdate') }}
      </UBadge>
      <div v-else />

      <div class="flex gap-3">
        <UButton variant="outline" icon="i-heroicons-arrow-path" @click="$emit('regenerate')">
          {{ t('canvas.actions.regenerate') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';

const { t } = useI18n();

interface Props {
  canvas: PersonalCanvas | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  save: [canvas: Partial<PersonalCanvas>];
  generate: [];
  regenerate: [];
}>();

const editingSection = ref<string | null>(null);
const localCanvas = ref<Partial<PersonalCanvas>>({});

const startEditingSection = (section: string) => {
  editingSection.value = section;
};

const cancelEditingSection = () => {
  editingSection.value = null;
};

const updateSection = (section: string, items: string[]) => {
  localCanvas.value = {
    ...localCanvas.value,
    [section]: items,
  };
};

const saveSectionChanges = (section: string) => {
  if (!localCanvas.value[section as keyof PersonalCanvas]) return;

  const updated: Partial<PersonalCanvas> = {
    [section]: localCanvas.value[section as keyof PersonalCanvas],
  };

  emit('save', updated);
  editingSection.value = null;
  localCanvas.value = {};
};

// Reset editing state when canvas changes
watch(
  () => props.canvas,
  () => {
    if (editingSection.value) {
      editingSection.value = null;
      localCanvas.value = {};
    }
  }
);
</script>
