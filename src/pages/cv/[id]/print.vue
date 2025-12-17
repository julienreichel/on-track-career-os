<template>
  <div class="print-container">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
        <p class="text-sm text-gray-600">{{ $t('cvDisplay.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl text-red-500 mb-4" />
        <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
        <UButton color="primary" @click="load">{{ $t('cvDisplay.actions.retry') }}</UButton>
      </div>
    </div>

    <!-- Print Content -->
    <div v-else-if="document" class="print-content">
      <!-- Print Actions (hidden on print) -->
      <div class="print-actions no-print">
        <UButton
          :label="$t('cvDisplay.actions.print')"
          icon="i-heroicons-printer"
          @click="handlePrint"
        />
        <UButton :label="$t('common.close')" variant="ghost" @click="handleClose" />
      </div>

      <!-- CV Content -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="cv-printable prose prose-gray" v-html="renderedHtml" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

definePageMeta({
  layout: false,
});

useHead({
  title: 'Print CV',
});

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const cvId = computed(() => route.params.id as string);

const service = new CVDocumentService();
const document = ref<CVDocument | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const renderedHtml = computed(() => {
  if (!document.value?.content) return '';
  return marked(document.value.content);
});

const load = async () => {
  loading.value = true;
  error.value = null;

  try {
    document.value = await service.getFullCVDocument(cvId.value);

    // Auto-trigger print dialog after content loads
    await nextTick();
    setTimeout(() => {
      window.print();
    }, 500);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load CV';
    console.error('[cvPrint] Error loading CV:', err);
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
  load();
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

.cv-printable {
  max-width: 100%;
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
  .prose h1 {
    border-bottom-color: #333 !important;
    color: #000 !important;
  }

  .prose h2 {
    border-bottom-color: #666 !important;
    color: #000 !important;
  }

  .prose h3,
  .prose p,
  .prose li {
    color: #000 !important;
  }

  .prose a {
    color: #000 !important;
    text-decoration: underline !important;
  }

  .prose code {
    background-color: #f0f0f0 !important;
    color: #000 !important;
  }
}

/* CV heading styles (matching main view) */
:deep(.prose h1) {
  font-size: 2.25rem;
  line-height: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #333;
  color: #000;
}

:deep(.prose h2) {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #666;
  color: #000;
}

:deep(.prose h3) {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 500;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: #000;
}

:deep(.prose p) {
  margin-bottom: 0.75rem;
  color: #000;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

:deep(.prose ul > li + li),
:deep(.prose ol > li + li) {
  margin-top: 0.25rem;
}

:deep(.prose li) {
  color: #000;
}

:deep(.prose strong) {
  font-weight: 600;
  color: #000;
}

:deep(.prose em) {
  font-style: italic;
  color: #333;
}

:deep(.prose code) {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background-color: #f0f0f0;
  color: #000;
}

:deep(.prose a) {
  color: #000;
  text-decoration: underline;
}

:deep(.prose a:hover) {
  text-decoration: underline;
}
</style>
