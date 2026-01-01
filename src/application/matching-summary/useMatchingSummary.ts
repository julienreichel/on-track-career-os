import { ref } from 'vue';
import { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { MatchingSummaryResult } from '@/domain/ai-operations/MatchingSummaryResult';

type IdOptions = { id: string };
type ContextOptions = { userId: string; jobId: string; companyId?: string | null };
type MatchingSummaryOptions = IdOptions | ContextOptions;

function isContextOptions(options: MatchingSummaryOptions): options is ContextOptions {
  return 'userId' in options && 'jobId' in options;
}

export function useMatchingSummary(options: MatchingSummaryOptions) {
  const summary = ref<MatchingSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new MatchingSummaryService();

  const run = async <T>(cb: () => Promise<T>) => {
    loading.value = true;
    error.value = null;
    try {
      return await cb();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const load = async () => {
    if ('id' in options) {
      const result = await run(() => service.getById(options.id));
      summary.value = result;
      return result;
    }
    const result = await run(() =>
      service.getByContext({
        userId: options.userId,
        jobId: options.jobId,
        companyId: options.companyId,
      })
    );
    summary.value = result;
    return result;
  };

  const upsert = isContextOptions(options)
    ? async (result: MatchingSummaryResult) => {
        const updated = await run(() =>
          service.upsertSummary({
            userId: options.userId,
            jobId: options.jobId,
            companyId: options.companyId,
            summary: result,
          })
        );
        summary.value = updated;
        return updated;
      }
    : undefined;

  const remove = async () => {
    if (!summary.value?.id) {
      return;
    }
    await run(() => service.deleteSummary(summary.value!.id));
    summary.value = null;
  };

  return {
    summary,
    loading,
    error,
    load,
    upsert,
    remove,
  };
}
