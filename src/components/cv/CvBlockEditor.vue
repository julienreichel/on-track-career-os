<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-3xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ $t('cvBlockEditor.title') }}
          </h3>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="sm"
            @click="close"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Block Title (optional for some types) -->
        <UFormGroup
          v-if="showTitleField"
          :label="$t('cvBlockEditor.fields.title')"
          name="title"
        >
          <UInput v-model="localTitle" :placeholder="$t('cvBlockEditor.placeholders.title')" />
        </UFormGroup>

        <!-- Block Content (main text) -->
        <UFormGroup :label="$t('cvBlockEditor.fields.content')" name="content" required>
          <UTextarea
            v-model="localContent"
            :placeholder="$t('cvBlockEditor.placeholders.content')"
            :rows="12"
            autoresize
          />
        </UFormGroup>

        <!-- Formatting help -->
        <div class="text-sm text-gray-500 space-y-1">
          <p class="font-medium">{{ $t('cvBlockEditor.formatting.title') }}:</p>
          <ul class="list-disc pl-5 space-y-0.5">
            <li>**{{ $t('cvBlockEditor.formatting.bold') }}** → <strong>bold</strong></li>
            <li>*{{ $t('cvBlockEditor.formatting.italic') }}* → <em>italic</em></li>
            <li>- {{ $t('cvBlockEditor.formatting.bullet') }}</li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="close">
            {{ $t('cvBlockEditor.actions.cancel') }}
          </UButton>
          <UButton :loading="saving" @click="save">
            {{ $t('cvBlockEditor.actions.save') }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CVBlock } from '@/domain/cvdocument/CVDocumentService';

interface Props {
  modelValue: boolean;
  block: CVBlock | null;
  saving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [updates: { title?: string; content: string }];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const localTitle = ref('');
const localContent = ref('');

// Determine if title field should be shown
const showTitleField = computed(() => {
  if (!props.block) return false;

  // Show title for experience, education, and custom sections
  return ['experience', 'education', 'custom'].includes(props.block.type);
});

// Initialize form when block changes
watch(
  () => props.block,
  (block) => {
    if (!block) {
      localTitle.value = '';
      localContent.value = '';
      return;
    }

    const content = block.content as { title?: string; text?: string };
    localTitle.value = content.title || '';
    localContent.value = content.text || '';
  },
  { immediate: true }
);

const save = () => {
  const updates: { title?: string; content: string } = {
    content: localContent.value,
  };

  if (showTitleField.value) {
    updates.title = localTitle.value;
  }

  emit('save', updates);
};

const close = () => {
  isOpen.value = false;
};
</script>
