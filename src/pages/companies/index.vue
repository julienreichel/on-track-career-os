<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCompanies } from '@/composables/useCompanies';
import CompanyCard from '@/components/company/CompanyCard.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import type { PageHeaderLink } from '@/types/ui';

const router = useRouter();
const { t } = useI18n();
const companyStore = useCompanies();

const loading = ref(false);
const hasLoaded = ref(false);
const errorMessage = ref<string | null>(null);
const showDeleteModal = ref(false);
const companyToDelete = ref<string | null>(null);

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('companies.list.actions.viewJobs'),
    icon: 'i-heroicons-briefcase',
    to: '/jobs',
    variant: 'ghost',
  },
  {
    label: t('companies.list.actions.add'),
    icon: 'i-heroicons-plus',
    to: '/companies/new',
  },
]);

const companies = companyStore.companies;
const rawCompanies = companyStore.rawCompanies;
const searchQuery = companyStore.searchQuery;

async function loadCompanies() {
  loading.value = true;
  hasLoaded.value = false;
  errorMessage.value = null;
  try {
    await companyStore.listCompanies();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('companies.list.errors.generic');
  } finally {
    loading.value = false;
    hasLoaded.value = true;
  }
}

onMounted(() => void loadCompanies());

function handleOpen(companyId: string) {
  void router.push(`/companies/${companyId}`);
}

function requestDelete(companyId: string) {
  companyToDelete.value = companyId;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!companyToDelete.value) return;
  try {
    await companyStore.deleteCompany(companyToDelete.value);
    showDeleteModal.value = false;
    companyToDelete.value = null;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('companies.list.errors.generic');
  }
}

function cancelDelete() {
  showDeleteModal.value = false;
  companyToDelete.value = null;
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('companies.list.title')"
        :description="t('companies.list.description')"
        :links="headerLinks"
      />

      <UPageBody>
        <div v-if="hasLoaded && !loading && rawCompanies.length > 0" class="mb-6">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            size="lg"
            class="w-1/3"
            :placeholder="t('companies.list.search.placeholder')"
          />
        </div>

        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('companies.list.errors.title')"
          :description="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          class="mb-6"
          @close="errorMessage = null"
        />

        <ListSkeletonCards v-if="loading || !hasLoaded" />

        <UCard v-else-if="rawCompanies.length === 0">
          <UEmpty :title="t('companies.list.empty.title')" icon="i-heroicons-building-office-2">
            <p class="text-sm text-gray-500">{{ t('companies.list.empty.description') }}</p>
            <template #actions>
              <UButton
                :label="t('companies.list.actions.add')"
                icon="i-heroicons-plus"
                @click="router.push('/companies/new')"
              />
            </template>
          </UEmpty>
        </UCard>

        <UCard v-else-if="companies.length === 0">
          <UEmpty :title="t('companies.list.search.noResults')" icon="i-heroicons-magnifying-glass">
            <p class="text-sm text-gray-500">
              {{ t('companies.list.search.placeholder') }}
            </p>
          </UEmpty>
        </UCard>

        <UPageGrid v-else>
          <CompanyCard
            v-for="company in companies"
            :key="company.id"
            :company="company"
            @open="handleOpen"
            @delete="requestDelete"
          />
        </UPageGrid>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="showDeleteModal"
      :title="t('companies.list.delete.title')"
      :description="t('companies.list.delete.message')"
    >
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('common.cancel')"
          @click="cancelDelete"
        />
        <UButton color="error" :label="t('companies.list.delete.confirm')" @click="confirmDelete" />
      </template>
    </UModal>
  </UContainer>
</template>
