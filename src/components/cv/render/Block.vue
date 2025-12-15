<template>
  <UCard
    :variant="isSelected ? 'subtle' : 'outline'"
    :class="['transition-all duration-200', { 'opacity-50 scale-95': isDragging }]"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <UIcon v-if="isDraggable" name="i-heroicons-bars-3" class="cursor-move shrink-0" />
          <span class="truncate">
            {{ blockTitle }}
          </span>
        </div>
        <slot name="actions" />
      </div>
    </template>

    <div>
      <slot :block="block">
        <!-- Default rendering for all block types -->
        <div class="prose prose-sm max-w-none" v-html="safeHtmlContent" />
      </slot>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
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

// Safe HTML content with markdown parsing and XSS protection
const safeHtmlContent = computed(() => {
  const content = blockContent.value;
  const text = (content.text as string) || '';

  if (!text) return '';

  // Convert markdown to HTML using marked library
  const rawHtml = marked.parse(text, { async: false }) as string;

  // Sanitize HTML to prevent XSS attacks
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li'],
  });
});
</script>
