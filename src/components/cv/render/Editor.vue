<template>
  <div class="cv-editor">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-[--ui-bg] border-b px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            @click="navigateBack"
          />
          <div>
            <h1 class="text-2xl font-bold">
              {{ document?.name || $t('cvEditor.untitled') }}
            </h1>
            <p class="text-sm opacity-75">
              {{ savingStatus }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            v-if="canUndo"
            icon="i-heroicons-arrow-uturn-left"
            color="neutral"
            variant="outline"
            @click="undo()"
          >
            {{ $t('cvEditor.actions.undo') }}
          </UButton>

          <UButton icon="i-heroicons-printer" color="neutral" variant="outline" @click="print">
            {{ $t('cvEditor.actions.print') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-6 py-8">
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin size-16" />
      </div>

      <div v-else-if="error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="size-16 mx-auto mb-4 text-error" />
        <p class="mb-4">{{ error }}</p>
        <UButton color="primary" @click="retry">
          {{ $t('cvEditor.actions.retry') }}
        </UButton>
      </div>

      <div v-else class="space-y-4">
        <!-- Empty state -->
        <div v-if="!hasBlocks" class="text-center py-12">
          <UIcon name="i-heroicons-document" class="size-16 mx-auto mb-4" />
          <p class="mb-4">{{ $t('cvEditor.emptyState') }}</p>
          <CvRenderSectionAdd :existing-types="existingBlockTypes" @add="handleAddSection" />
        </div>

        <!-- Blocks -->
        <Draggable
          v-else
          v-model="blocksList"
          item-key="id"
          handle=".cursor-move"
          @start="handleDragStart"
          @end="handleDragEnd"
        >
          <template #item="{ element: block, index }">
            <div class="mb-4">
              <CvRenderBlock
                :block="block"
                :is-draggable="true"
                :is-dragging="draggedBlockId === block.id"
                :is-selected="selectedBlockId === block.id"
                @click="selectBlock(block.id)"
              >
                <template #actions>
                  <CvRenderBlockActions
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
              </CvRenderBlock>
            </div>
          </template>
        </Draggable>

        <!-- Add Section Button -->
        <CvRenderSectionAdd
          v-if="hasBlocks"
          :existing-types="existingBlockTypes"
          @add="handleAddSection"
        />
      </div>
    </div>

    <!-- Block Editor Modal -->
    <CvRenderBlockEditor
      v-model="editorOpen"
      :block="editingBlock"
      :saving="saving"
      @save="saveBlockEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Draggable from 'vuedraggable';
import { useCvEditor } from '@/composables/useCvEditor';
import { useCvGenerator } from '@/composables/useCvGenerator';
import type { CVBlock } from '@/domain/cvdocument/CVDocumentService';

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
  addBlock,
  removeBlock: removeBlockFromEditor,
  updateBlock,
  moveBlock: moveBlockInEditor,
  undo,
  replaceBlock,
} = useCvEditor(props.cvId);

const { regenerateBlock: regenerateBlockAI } = useCvGenerator();

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
  set: () => {
    // Handled by drag end event
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
    color: 'success',
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

  // Open editor for the new block after DOM update
  const EDITOR_OPEN_DELAY_MS = 100;
  setTimeout(() => {
    const addedBlock = blocks.value.find((b) => b.id === newBlock.id);
    if (addedBlock) {
      openEditor(addedBlock);
    }
  }, EDITOR_OPEN_DELAY_MS);
};

const moveBlock = (blockId: string, direction: 'up' | 'down') => {
  moveBlockInEditor(blockId, direction);
};

const removeBlock = (blockId: string) => {
  removeBlockFromEditor(blockId);
  toast.add({
    title: t('cvEditor.toast.blockRemoved'),
    color: 'success',
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
        color: 'success',
      });
    } else {
      toast.add({
        title: t('cvEditor.toast.regenerationFailed'),
        color: 'error',
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
/* Print styles */
@media print {
  .sticky,
  :deep(.cv-render-block-actions) {
    display: none;
  }

  .cv-editor {
    max-width: none;
  }
}
</style>
