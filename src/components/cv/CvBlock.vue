<template>
  <UCard
    :ui="{
      body: { padding: 'p-4' },
      header: { padding: 'p-3' },
    }"
    class="cv-block"
    :class="{
      'cv-block--dragging': isDragging,
      'cv-block--selected': isSelected,
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <UIcon
            v-if="isDraggable"
            name="i-heroicons-bars-3"
            class="text-gray-400 cursor-move flex-shrink-0"
          />
          <span class="text-sm font-medium text-gray-700 truncate">
            {{ blockTitle }}
          </span>
        </div>
        <slot name="actions" />
      </div>
    </template>

    <div class="cv-block__content">
      <slot :block="block">
        <!-- Default rendering based on block type -->
        <div v-if="block.type === 'summary'" class="prose prose-sm max-w-none">
          <p v-html="formattedContent" />
        </div>

        <div v-else-if="block.type === 'experience'" class="space-y-2">
          <h3 v-if="blockContent.title" class="text-base font-semibold text-gray-900">
            {{ blockContent.title }}
          </h3>
          <div v-html="formattedContent" class="prose prose-sm max-w-none" />
        </div>

        <div v-else-if="block.type === 'education'" class="space-y-2">
          <h3 v-if="blockContent.title" class="text-base font-semibold text-gray-900">
            {{ blockContent.title }}
          </h3>
          <div v-html="formattedContent" class="prose prose-sm max-w-none" />
        </div>

        <div v-else-if="block.type === 'skills'" class="prose prose-sm max-w-none">
          <div v-html="formattedContent" />
        </div>

        <div v-else-if="block.type === 'languages'" class="prose prose-sm max-w-none">
          <div v-html="formattedContent" />
        </div>

        <div v-else-if="block.type === 'certifications'" class="prose prose-sm max-w-none">
          <div v-html="formattedContent" />
        </div>

        <div v-else-if="block.type === 'interests'" class="prose prose-sm max-w-none">
          <div v-html="formattedContent" />
        </div>

        <div v-else class="prose prose-sm max-w-none">
          <h3 v-if="blockContent.title" class="text-base font-semibold text-gray-900">
            {{ blockContent.title }}
          </h3>
          <div v-html="formattedContent" />
        </div>
      </slot>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CVBlock } from '@/domain/cvdocument/CVDocumentService';

interface Props {
  block: CVBlock;
  isDraggable?: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDraggable: true,
  isDragging: false,
  isSelected: false,
});

// Block content extraction
const blockContent = computed(() => {
  return (props.block.content as Record<string, unknown>) || {};
});

// Block title for header
const blockTitle = computed(() => {
  const { t } = useI18n();
  const content = blockContent.value;

  if (content.title && typeof content.title === 'string') {
    return content.title;
  }

  // Fallback to translated type name
  return t(`cvBlock.types.${props.block.type}`);
});

// Format content with basic markdown support (bold, italic, lists)
const formattedContent = computed(() => {
  const content = blockContent.value;
  const text = (content.text as string) || '';

  if (!text) return '';

  // Convert basic markdown to HTML
  let html = text
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Bullet lists: lines starting with - or *
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // Numbered lists: lines starting with 1. 2. etc
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>');

  // Wrap list items
  html = html.replace(/(<li>.*<\/li>)+/gs, '<ul>$&</ul>');

  return html;
});
</script>

<style scoped>
.cv-block {
  @apply transition-all duration-200;
}

.cv-block--dragging {
  @apply opacity-50 scale-95;
}

.cv-block--selected {
  @apply ring-2 ring-primary-500;
}

.cv-block__content {
  @apply text-gray-700;
}

/* Prose styling for content */
.cv-block__content :deep(ul) {
  @apply list-disc pl-5 space-y-1;
}

.cv-block__content :deep(strong) {
  @apply font-semibold text-gray-900;
}

.cv-block__content :deep(em) {
  @apply italic;
}
</style>
