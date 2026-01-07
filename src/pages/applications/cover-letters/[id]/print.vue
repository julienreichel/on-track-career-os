<template>
  <div class="print-container">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
        <p class="text-sm text-gray-600">{{ $t('coverLetter.display.loading') }}</p>
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
          :label="$t('coverLetter.display.actions.print')"
          icon="i-heroicons-printer"
          @click="handlePrint"
        />
        <UButton :label="$t('common.close')" variant="ghost" @click="handleClose" />
      </div>

      <!-- Cover Letter Content -->
      <div class="cover-letter-printable prose">
        <div class="whitespace-pre-wrap">{{ item.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useCoverLetter } from '@/application/cover-letter/useCoverLetter';

definePageMeta({
  layout: false,
});

useHead({
  title: 'Print Cover Letter',
});

const route = useRoute();

const coverLetterId = computed(() => route.params.id as string);

const PRINT_DELAY_MS = 500;

const { item, loading, error, load } = useCoverLetter(coverLetterId.value);

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
  loadPrint();
});
</script>

<style scoped>
.print-container {
  min-height: 100vh;
  background: white;
}

.print-actions {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1000;
  background: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.print-content {
  padding: 2rem;
  max-width: 21cm;
  margin: 0 auto;
}

.cover-letter-printable {
  max-width: 100%;
}

/* Screen styles - make text black on screen too */
.prose {
  color: #000;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  color: #000;
}

.prose p,
.prose li,
.prose blockquote {
  color: #000;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  .print-container {
    background: white;
  }

  .print-content {
    padding: 0;
    max-width: 100%;
    margin: 0;
  }

  @page {
    size: A4;
    margin: 1.5cm 2cm;
  }

  /* Ensure proper page breaks */
  .prose h1,
  .prose h2,
  .prose h3 {
    page-break-after: avoid;
    page-break-inside: avoid;
  }

  .prose ul,
  .prose ol,
  .prose p {
    page-break-inside: avoid;
  }

  /* Adjust colors for print */
  .prose {
    color: #000 !important;
  }

  .prose h1 {
    border-bottom-color: #333 !important;
    color: #000 !important;
  }

  .prose h2 {
    border-bottom-color: #666 !important;
    color: #000 !important;
  }

  .prose h3,
  .prose p {
    color: #000 !important;
  }

  .prose a {
    color: #000 !important;
    text-decoration: underline !important;
  }
}

/* Cover letter heading styles */
:deep(.prose h1) {
  font-size: 2rem;
  line-height: 2.25rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #333;
}

:deep(.prose h2) {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #333;
}

:deep(.prose h3) {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #444;
}

:deep(.prose p) {
  margin-bottom: 1rem;
  line-height: 1.75;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

:deep(.prose li) {
  margin-bottom: 0.5rem;
  line-height: 1.75;
}

:deep(.prose a) {
  color: #0066cc;
  text-decoration: underline;
}
</style>
