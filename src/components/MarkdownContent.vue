<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-html="renderedHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = withDefaults(
  defineProps<{
    content?: string | null;
  }>(),
  {
    content: '',
  }
);

const renderedHtml = computed(() => {
  if (!props.content) return '';
  const rawHtml = marked.parse(props.content, { async: false });
  if (typeof rawHtml !== 'string') return '';
  return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
});
</script>
