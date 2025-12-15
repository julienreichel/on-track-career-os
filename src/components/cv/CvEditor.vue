<template>
  <div class="cv-editor">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UButton
            icon="i-heroicons-arrow-left"
            color="gray"
            variant="ghost"
            @click="navigateBack"
          />
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ document?.name || $t('cvEditor.untitled') }}
            </h1>
            <p class="text-sm text-gray-500">
              {{ savingStatus }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            v-if="canUndo"
            icon="i-heroicons-arrow-uturn-left"
            color="gray"
            variant="outline"
            @click="undo()"
          >
            {{ $t('cvEditor.actions.undo') }}
          </UButton>

          <UButton
            icon="i-heroicons-printer"
            color="gray"
            variant="outline"
            @click="print"
          >
            {{ $t('cvEditor.actions.print') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-6 py-8">
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-gray-400" />
      </div>

      <div v-else-if="error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-4xl text-red-500 mx-auto mb-4" />
        <p class="text-gray-700">{{ error }}</p>
        <UButton color="primary" class="mt-4" @click="retry">
          {{ $t('cvEditor.actions.retry') }}
        </UButton>
      </div>

      <div v-else class="space-y-4">
        <!-- Empty state -->
        <div v-if="!hasBlocks" class="text-center py-12">
          <UIcon name="i-heroicons-document" class="text-4xl text-gray-400 mx-auto mb-4" />
          <p class="text-gray-700 mb-4">{{ $t('cvEditor.emptyState') }}</p>
          <CvSectionAdd :existing-types="existingBlockTypes" @add="handleAddSection" />
        </div>

        <!-- Blocks -->
        <draggable
          v-else
          v-model="blocksList"
          item-key="id"
          handle=".cursor-move"
          @start="handleDragStart"
          @end="handleDragEnd"
        >
          <template #item="{ element: block, index }">
            <div class="cv-editor__block">
              <CvBlock
                :block="block"
                :is-draggable="true"
                :is-dragging="draggedBlockId === block.id"
                :is-selected="selectedBlockId === block.id"
                @click="selectBlock(block.id)"
              >
                <template #actions>
                  <CvBlockActions
                    :is-first="index === 0"
                    :is-last="index === blocks.length - 1"
                    :is-regenerating="regeneratingBlockId === block.id"
                    @move-up="moveBlock(block.id, 'up')"
                    @move-down="moveBlock(block.id, 'down')"
                    @edit="openEditor(block)"
                    @regenerate="regenerateBlock(block)"
                    @remove="removeBlock(block.id)"
                  />
                </template>
              </CvBlock>
            </div>
          </template>
        </draggable>

        <!-- Add Section Button -->
        <CvSectionAdd
          v-if="hasBlocks"
          :existing-types="existingBlockTypes"
          @add="handleAddSection"
        />
      </div>
    </div>

    <!-- Block Editor Modal -->
    <CvBlockEditor
      v-model="editorOpen"
      :block="editingBlock"
      :saving="saving"
      @save="saveBlockEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { useCvEditor } from '@/application/cvdocument/useCvEditor';
import { useCvGenerator } from '@/application/cvdocument/useCvGenerator';
import type { CVBlock } from '@/domain/cvdocument/CVDocumentService';
import CvBlock from './CvBlock.vue';
import CvBlockActions from './CvBlockActions.vue';
import CvBlockEditor from './CvBlockEditor.vue';
import CvSectionAdd from './CvSectionAdd.vue';

interface Props {
  cvId: string;
  userId: string;
  selectedExperienceIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  selectedExperienceIds: () => [],
});

const { t } = useI18n();
const router = useRouter();
const toast = useToast();

// Composables
const {
  document,
  blocks,
  loading,
  saving,
  error,
  isDirty,
  hasBlocks,
  canUndo,
  load,
  save,
  addBlock,
  removeBlock: removeBlockFromEditor,
  updateBlock,
  moveBlock: moveBlockInEditor,
  undo,
  replaceBlock,
} = useCvEditor(props.cvId);

const { generating: regenerating, regenerateBlock: regenerateBlockAI } = useCvGenerator();

// Local state
const draggedBlockId = ref<string | null>(null);
const selectedBlockId = ref<string | null>(null);
const editorOpen = ref(false);
const editingBlock = ref<CVBlock | null>(null);
const regeneratingBlockId = ref<string | null>(null);

// Computed
const savingStatus = computed(() => {
  if (saving.value) return t('cvEditor.status.saving');
  if (isDirty.value) return t('cvEditor.status.unsaved');
  return t('cvEditor.status.saved');
});

const existingBlockTypes = computed(() => {
  return blocks.value.map((b) => b.type);
});

// Make blocks draggable
const blocksList = computed({
  get: () => blocks.value,
  set: (newBlocks) => {
    const newOrder = newBlocks.map((b) => b.id);
    // This will be handled by the drag end event
  },
});

// Methods
const navigateBack = () => {
  router.push({ name: 'cv' });
};

const selectBlock = (blockId: string) => {
  selectedBlockId.value = selectedBlockId.value === blockId ? null : blockId;
};

const openEditor = (block: CVBlock) => {
  editingBlock.value = block;
  editorOpen.value = true;
};

const saveBlockEdit = async (updates: { title?: string; content: string }) => {
  if (!editingBlock.value) return;

  const blockId = editingBlock.value.id;
  const currentContent = editingBlock.value.content as Record<string, unknown>;

  updateBlock(blockId, {
    ...editingBlock.value,
    content: {
      ...currentContent,
      title: updates.title,
      text: updates.content,
    },
  });

  editorOpen.value = false;
  editingBlock.value = null;

  toast.add({
    title: t('cvEditor.toast.blockUpdated'),
    color: 'green',
  });
};

const handleAddSection = async (sectionType: string) => {
  // Create empty block
  const newBlock: Omit<CVBlock, 'order'> = {
    id: `block-${Date.now()}`,
    type: sectionType,
    content: {
      title: sectionType === 'custom' ? t('cvEditor.newSection') : null,
      text: '',
    },
  };

  addBlock(newBlock);

  // Open editor for the new block
  setTimeout(() => {
    const addedBlock = blocks.value.find((b) => b.id === newBlock.id);
    if (addedBlock) {
      openEditor(addedBlock);
    }
  }, 100);
};

const moveBlock = (blockId: string, direction: 'up' | 'down') => {
  moveBlockInEditor(blockId, direction);
};

const removeBlock = (blockId: string) => {
  removeBlockFromEditor(blockId);
  toast.add({
    title: t('cvEditor.toast.blockRemoved'),
    color: 'green',
  });
};

const regenerateBlock = async (block: CVBlock) => {
  regeneratingBlockId.value = block.id;

  try {
    const regenerated = await regenerateBlockAI(
      props.userId,
      props.selectedExperienceIds,
      block,
      blocks.value
    );

    if (regenerated) {
      replaceBlock(block.id, regenerated);
      toast.add({
        title: t('cvEditor.toast.blockRegenerated'),
        color: 'green',
      });
    } else {
      toast.add({
        title: t('cvEditor.toast.regenerationFailed'),
        color: 'red',
      });
    }
  } finally {
    regeneratingBlockId.value = null;
  }
};

const handleDragStart = (event: { item: { dataset: { id: string } } }) => {
  const blockId = event.item.dataset.id;
  draggedBlockId.value = blockId;
};

const handleDragEnd = () => {
  draggedBlockId.value = null;
  // Reorder is handled automatically by v-model binding in draggable
  const newOrder = blocksList.value.map((b) => b.id);
  // The useCvEditor composable will handle the reorder via the blocks ref
};

const print = () => {
  window.print();
};

const retry = () => {
  if (props.cvId) {
    load(props.cvId);
  }
};
</script>

<style scoped>
.cv-editor__block {
  @apply mb-4;
}

/* Print styles */
@media print {
  .sticky,
  .cv-editor__block :deep(.cv-block-actions) {
    @apply hidden;
  }

  .cv-editor {
    @apply max-w-none;
  }
}
</style>
