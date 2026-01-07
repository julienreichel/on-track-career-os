import { ref } from 'vue';
import type { Company } from '@/domain/company/Company';
import { CompanyService } from '@/domain/company/CompanyService';

export function useCompany(companyId: string) {
  const company = ref<Company | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new CompanyService();

  const run = async <T>(cb: () => Promise<T>): Promise<T> => {
    loading.value = true;
    error.value = null;
    try {
      return await cb();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const load = async () => {
    const result = await run(() => service.getCompany(companyId));
    company.value = result;
    return result;
  };

  const loadWithRelations = async () => {
    const result = await run(() => service.getCompanyWithRelations(companyId));
    company.value = result;
    return result;
  };

  const save = async (patch: Record<string, unknown>) => {
    const updated = await run(() => service.updateCompany(companyId, patch));
    company.value = updated;
    return updated;
  };

  const analyze = async (options?: { rawText?: string }) => {
    const updated = await run(() => service.analyzeCompany(companyId, options));
    company.value = updated;
    return updated;
  };

  return {
    company,
    loading,
    error,
    load,
    loadWithRelations,
    save,
    analyze,
  };
}
