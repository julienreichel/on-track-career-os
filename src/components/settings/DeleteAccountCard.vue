<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    loading?: boolean;
  }>(),
  {
    loading: false,
  }
);

const emit = defineEmits<{
  confirm: [];
}>();

const { t } = useI18n();
const confirmOpen = ref(false);

const openConfirm = () => {
  confirmOpen.value = true;
};

const handleConfirm = () => {
  emit('confirm');
};
</script>

<template>
  <UCard>
    <div class="space-y-2">
      <h2 class="text-lg font-semibold text-default">{{ t('settings.accountDeletion.title') }}</h2>
      <p class="text-sm text-dimmed">{{ t('settings.accountDeletion.description') }}</p>
      <UButton
        color="error"
        variant="outline"
        icon="i-heroicons-trash"
        :label="t('settings.accountDeletion.action')"
        :loading="loading"
        @click="openConfirm"
      />
    </div>
  </UCard>

  <ConfirmModal
    v-model:open="confirmOpen"
    :title="t('settings.accountDeletion.confirmTitle')"
    :description="t('settings.accountDeletion.confirmDescription')"
    :confirm-label="t('settings.accountDeletion.confirmAction')"
    :cancel-label="t('common.actions.cancel')"
    confirm-color="error"
    :loading="loading"
    @confirm="handleConfirm"
  />
</template>
