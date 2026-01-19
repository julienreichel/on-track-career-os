<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-html="renderedHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

const props = withDefaults(
  defineProps<{
    content?: string | null;
  }>(),
  {
    content: '',
  }
);

const renderedHtml = computed(() => (props.content ? marked(props.content) : ''));
</script>
