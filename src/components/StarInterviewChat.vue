<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ChatMessage } from '@/composables/useStarInterview';

const props = defineProps<{
  messages: ChatMessage[];
  currentQuestion?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [answer: string];
}>();

const { t } = useI18n();
const currentAnswer = ref('');

const hasMessages = computed(() => props.messages.length > 0);
const canSubmit = computed(() => currentAnswer.value.trim().length > 0 && !props.loading);

const handleSubmit = () => {
  if (!canSubmit.value) return;

  emit('submit', currentAnswer.value);
  currentAnswer.value = '';
};

const formatMessage = (message: ChatMessage) => {
  // Translate if message content is an i18n key
  return message.content.includes('.') ? t(message.content) : message.content;
};
</script>

<template>
  <div class="space-y-4">
    <!-- Chat Messages -->
    <UCard>
      <div class="space-y-4 max-h-96 overflow-y-auto">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="[
            'p-3 rounded-lg',
            message.role === 'assistant'
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'bg-gray-50 dark:bg-gray-800 ml-8',
          ]"
        >
          <div class="text-sm font-medium mb-1">
            {{ message.role === 'assistant' ? t('interview.assistant') : t('interview.you') }}
          </div>
          <div class="text-sm whitespace-pre-wrap">
            {{ formatMessage(message) }}
          </div>
        </div>

        <div v-if="loading" class="flex items-center space-x-2">
          <USkeleton class="h-4 w-4" />
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ t('interview.thinking') }}
          </span>
        </div>
      </div>
    </UCard>

    <!-- Answer Input -->
    <UCard v-if="currentQuestion">
      <div class="space-y-4">
        <UFormField :label="t('interview.yourAnswer')" required>
          <UTextarea
            v-model="currentAnswer"
            :placeholder="t('interview.answerPlaceholder')"
            :rows="4"
            :disabled="loading"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            :label="t('interview.submit')"
            icon="i-heroicons-arrow-right"
            :disabled="!canSubmit"
            @click="handleSubmit"
          />
        </div>
      </div>
    </UCard>

    <!-- Empty State -->
    <UEmpty
      v-if="!hasMessages && !currentQuestion"
      :title="t('interview.noMessages')"
      icon="i-heroicons-chat-bubble-left-right"
    />
  </div>
</template>
