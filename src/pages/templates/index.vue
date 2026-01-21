<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('templates.title')"
        :description="t('templates.subtitle')"
        :links="[
          {
            label: t('templates.actions.cvTemplates'),
            icon: 'i-heroicons-document-text',
            to: { name: 'templates-cv' },
          },
        ]"
      />

      <UPageBody>
        <UCard>
          <UEmpty :title="t('templates.empty.title')" icon="i-heroicons-document-text">
            <p class="text-sm text-gray-500">
              {{ t('templates.empty.description') }}
            </p>
            <template #actions>
              <UButton
                color="primary"
                :label="t('templates.actions.cvTemplates')"
                icon="i-heroicons-arrow-right"
                @click="navigateTo({ name: 'templates-cv' })"
              />
            </template>
          </UEmpty>
        </UCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>
