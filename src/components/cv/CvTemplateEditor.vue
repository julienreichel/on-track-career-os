<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import MarkdownContent from '@/components/MarkdownContent.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  name: string;
  content: string;
  loading?: boolean;
  nameLabel?: string;
  contentLabel?: string;
  previewLabel?: string;
  showPreviewLabel?: string;
  hidePreviewLabel?: string;
}>();

const emit = defineEmits<{
  'update:name': [value: string];
  'update:content': [value: string];
}>();

const { t } = useI18n();
const showPreview = ref(false);

const resolvedNameLabel = computed(() => props.nameLabel ?? t('cvTemplates.editor.nameLabel'));
const resolvedContentLabel = computed(
  () => props.contentLabel ?? t('cvTemplates.editor.contentLabel')
);
const resolvedPreviewLabel = computed(() => props.previewLabel ?? t('cvTemplates.editor.preview'));
const resolvedToggleLabel = computed(() =>
  showPreview.value
    ? (props.hidePreviewLabel ?? t('cvTemplates.editor.hidePreview'))
    : (props.showPreviewLabel ?? t('cvTemplates.editor.showPreview'))
);

watch(
  () => props.name,
  (value) => {
    if (value !== nameInput.value) {
      nameInput.value = value;
    }
  }
);

watch(
  () => props.content,
  (value) => {
    if (value !== contentInput.value) {
      contentInput.value = value;
    }
  }
);

const nameInput = ref(props.name);
const contentInput = ref(props.content);

watch(nameInput, (value) => emit('update:name', value));
watch(contentInput, (value) => emit('update:content', value));
</script>

<template>
  <div class="space-y-6">
    <UFormField :label="resolvedNameLabel">
      <UInput v-model="nameInput" :disabled="loading" class="w-xs" />
    </UFormField>

    <UFormField :label="resolvedContentLabel">
      <UTextarea v-model="contentInput" :rows="16" class="w-full" :disabled="loading" />
    </UFormField>

    <div class="flex items-center justify-between">
      <p class="text-sm text-dimmed">{{ resolvedPreviewLabel }}</p>
      <UButton
        size="sm"
        variant="ghost"
        :label="resolvedToggleLabel"
        @click="showPreview = !showPreview"
      />
    </div>

    <UCard v-if="showPreview">
      <MarkdownContent :content="contentInput" class="doc-markdown" />
    </UCard>
  </div>
</template>
