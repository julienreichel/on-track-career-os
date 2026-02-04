<template>
  <div class="print-container">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
        <p class="text-sm text-gray-600">{{ $t('applications.cvs.display.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl text-red-500 mb-4" />
        <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
        <UButton color="primary" @click="load">{{
          $t('applications.cvs.display.actions.retry')
        }}</UButton>
      </div>
    </div>

    <!-- Print Content -->
    <div v-else-if="cvDocument" class="print-content">
      <!-- Print Actions (hidden on print) -->
      <div class="print-actions no-print">
        <UButton
          :label="$t('applications.cvs.display.actions.print')"
          icon="i-heroicons-printer"
          @click="handlePrint"
        />
        <UButton :label="$t('common.actions.close')" variant="ghost" @click="handleClose" />
      </div>

      <!-- CV Content -->
      <div class="relative">
        <div v-if="showPhoto" class="print-photo">
          <img :src="profilePhotoUrl!" :alt="$t('applications.cvs.display.photoAlt')" />
        </div>
        <MarkdownContent :content="cvDocument.content" class="cv-printable doc-print" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import MarkdownContent from '@/components/MarkdownContent.vue';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

definePageMeta({
  layout: false,
});

const route = useRoute();

const cvId = computed(() => route.params.id as string);

const PRINT_DELAY_MS = 500;

const service = new CVDocumentService();
const userProfileService = new UserProfileService();
const profilePhotoService = new ProfilePhotoService();
const cvDocument = ref<CVDocument | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const profilePhotoUrl = ref<string | null>(null);
const profilePhotoLoading = ref(false);
const profilePhotoError = ref<string | null>(null);

useHead(() => ({
  title: cvDocument.value?.name?.trim() || 'Print CV',
}));

const showPhoto = computed(() => {
  return (cvDocument.value?.showProfilePhoto ?? true) && !!profilePhotoUrl.value;
});

const loadProfilePhoto = async (userId: string) => {
  profilePhotoLoading.value = true;
  profilePhotoError.value = null;

  try {
    const profile = await userProfileService.getFullUserProfile(userId);
    const key = profile?.profilePhotoKey;
    if (key) {
      profilePhotoUrl.value = await profilePhotoService.getSignedUrl(key);
    } else {
      profilePhotoUrl.value = null;
    }
  } catch (err) {
    profilePhotoUrl.value = null;
    profilePhotoError.value = err instanceof Error ? err.message : 'Failed to load profile photo';
    console.error('[cvPrint] Error loading profile photo:', err);
  } finally {
    profilePhotoLoading.value = false;
  }
};

const load = async () => {
  loading.value = true;
  error.value = null;

  try {
    cvDocument.value = await service.getFullCVDocument(cvId.value);
    if (cvDocument.value) {
      await loadProfilePhoto(cvDocument.value.userId);
    }

    // Auto-trigger print dialog after content loads
    await nextTick();
    setTimeout(() => {
      window.print();
    }, PRINT_DELAY_MS);
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
  void load();
});
</script>
