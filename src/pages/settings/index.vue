<script setup lang="ts">
const { t } = useI18n();
const toast = useToast();
const { deleteAccount, deleting } = useAccountDeletion();

const handleDeleteAccount = async () => {
  const deleted = await deleteAccount();
  if (!deleted) {
    toast.add({
      title: t('settings.accountDeletion.deleteFailed'),
      color: 'error',
    });
  }
};
</script>

<template>
  <UPage>
    <UPageHeader :title="t('settings.title')" :description="t('settings.subtitle')" />
    <UPageBody>
      <div class="space-y-4">
        <UCard>
          <div class="space-y-2">
            <h2 class="text-lg font-semibold text-default">{{ t('settings.cv.title') }}</h2>
            <p class="text-sm text-dimmed">{{ t('settings.cv.description') }}</p>
            <UButton
              color="primary"
              variant="outline"
              icon="i-heroicons-arrow-right"
              :label="t('settings.cv.action')"
              to="/settings/cv"
            />
          </div>
        </UCard>

        <SettingsDeleteAccountCard :loading="deleting" @confirm="handleDeleteAccount" />
      </div>
    </UPageBody>
  </UPage>
</template>
