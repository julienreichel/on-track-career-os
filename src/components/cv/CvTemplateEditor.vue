<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import MarkdownContent from '@/components/MarkdownContent.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  name: string;
  content: string;
  loading?: boolean;
  previewContent?: string;
  previewLoading?: boolean;
  previewError?: string | null;
  nameLabel?: string;
  contentLabel?: string;
  previewLabel?: string;
  showPreviewLabel?: string;
  hidePreviewLabel?: string;
}>();

const emit = defineEmits<{
  'update:name': [value: string];
  'update:content': [value: string];
  preview: [];
}>();

const { t } = useI18n();
const showPreview = ref(false);

const resolvedNameLabel = computed(() => props.nameLabel ?? t('applications.cvs.templates.editor.nameLabel'));
const resolvedContentLabel = computed(
  () => props.contentLabel ?? t('applications.cvs.templates.editor.contentLabel')
);
const resolvedPreviewLabel = computed(() => props.previewLabel ?? t('applications.cvs.templates.editor.preview'));
const resolvedToggleLabel = computed(() =>
  showPreview.value
    ? (props.hidePreviewLabel ?? t('applications.cvs.templates.editor.hidePreview'))
    : (props.showPreviewLabel ?? t('applications.cvs.templates.editor.showPreview'))
);

const previewContent = computed(() => props.previewContent ?? contentInput.value);

const togglePreview = () => {
  showPreview.value = !showPreview.value;
  if (showPreview.value) {
    emit('preview');
  }
};

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
      <div class="flex items-center gap-2">
        <UButton
          v-if="showPreview"
          size="sm"
          variant="soft"
          :label="t('applications.cvs.templates.editor.regenerate')"
          :disabled="previewLoading"
          @click="emit('preview')"
        />
        <UButton size="sm" variant="ghost" :label="resolvedToggleLabel" @click="togglePreview" />
      </div>
    </div>

    <UCard v-if="showPreview">
      <div v-if="previewLoading" class="space-y-3">
        <USkeleton class="h-4 w-40" />
        <USkeleton class="h-24 w-full" />
      </div>
      <div v-else>
        <MarkdownContent :content="previewContent" class="doc-markdown" />
        <p v-if="previewError" class="mt-3 text-sm text-red-600">
          {{ previewError }}
        </p>
      </div>
    </UCard>
  </div>
</template>
