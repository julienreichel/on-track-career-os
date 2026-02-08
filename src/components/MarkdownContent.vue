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
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'p',
      'br',
      'hr',
      'b',
      'strong',
      'i',
      'em',
      'u',
      's',
      'mark',
      'small',
      'blockquote',
      'code',
      'pre',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'a',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'colspan', 'rowspan', 'align'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onclick'],
  });
});
</script>
