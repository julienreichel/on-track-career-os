<template>
  <div class="print-container">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
        <p class="text-sm text-gray-600">{{ $t('applications.coverLetters.display.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl text-red-500 mb-4" />
        <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
        <UButton color="primary" @click="load">{{ $t('common.retry') }}</UButton>
      </div>
    </div>

    <!-- Print Content -->
    <div v-else-if="item" class="print-content">
      <!-- Print Actions (hidden on print) -->
      <div class="print-actions no-print">
        <UButton
          :label="$t('applications.coverLetters.display.actions.print')"
          icon="i-heroicons-printer"
          @click="handlePrint"
        />
        <UButton :label="$t('common.close')" variant="ghost" @click="handleClose" />
      </div>

      <!-- Cover Letter Content -->
      <MarkdownContent :content="item.content" class="cover-letter-printable doc-print" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useCoverLetter } from '@/application/cover-letter/useCoverLetter';
import MarkdownContent from '@/components/MarkdownContent.vue';

definePageMeta({
  layout: false,
});

const route = useRoute();

const coverLetterId = computed(() => route.params.id as string);

const PRINT_DELAY_MS = 500;

const { item, loading, error, load } = useCoverLetter(coverLetterId.value);

useHead(() => ({
  title: item.value?.name?.trim() || 'Print Cover Letter',
}));

const loadPrint = async () => {
  try {
    loading.value = true;
    await load();

    // Auto-trigger print dialog after content loads
    await nextTick();
    setTimeout(() => {
      window.print();
    }, PRINT_DELAY_MS);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load cover letter';
    console.error('[coverLetterPrint] Error loading cover letter:', err);
  } finally {
    loading.value = false;
  }
};

const handlePrint = () => {
  window.print();
};

const handleClose = () => {
  window.close();
};

onMounted(() => {
  void loadPrint();
});
</script>
