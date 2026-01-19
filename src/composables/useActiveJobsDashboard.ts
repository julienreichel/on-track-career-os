import { computed, ref } from 'vue';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { useCvDocuments } from '@/composables/useCvDocuments';
import { useCoverLetters } from '@/application/cover-letter/useCoverLetters';
import { useSpeechBlocks } from '@/application/speech-block/useSpeechBlocks';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';

export type JobMaterialKey = 'cv' | 'coverLetter' | 'speech';

export type JobMatchStatus = 'pending' | 'ready';

export type JobApplicationState = {
  jobId: string;
  title: string;
  companyName?: string | null;
  matchStatus: JobMatchStatus;
  matchLabelKey: string;
  matchLabelParams?: Record<string, string | number>;
  matchScore?: number | null;
  materials: Record<JobMaterialKey, boolean>;
  materialsMissing: JobMaterialKey[];
  cta: {
    labelKey: string;
    to: string;
  };
};

const MAX_ACTIVE_JOBS = 3;

const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const hasJobMaterial = <T extends { jobId?: string | null }>(
  items: T[],
  jobId: string
) => items.some((item) => item.jobId === jobId);

type MatchingSummaryLite = {
  overallScore?: number | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  generatedAt?: string | null;
};

const pickMostRecentSummary = (summaries?: MatchingSummaryLite[] | null) => {
  if (!Array.isArray(summaries) || summaries.length === 0) {
    return null;
  }
  return [...summaries].sort((a, b) => {
    const dateA = new Date(a.updatedAt ?? a.generatedAt ?? a.createdAt ?? 0).getTime();
    const dateB = new Date(b.updatedAt ?? b.generatedAt ?? b.createdAt ?? 0).getTime();
    return dateB - dateA;
  })[0]!;
};

const resolveMatchStatus = (
  job: JobDescription & { matchingSummaries?: MatchingSummaryLite[] | null }
): {
  status: JobMatchStatus;
  labelKey: string;
  labelParams?: Record<string, string | number>;
  score?: number | null;
} => {
  const summary = pickMostRecentSummary(job.matchingSummaries);
  const score =
    typeof summary?.overallScore === 'number' ? Math.round(summary.overallScore) : null;

  if (job.status === 'analyzed' && score !== null) {
    return {
      status: 'ready',
      labelKey: 'dashboard.activeJobs.match.value',
      labelParams: { score },
      score,
    };
  }
  return {
    status: 'pending',
    labelKey: 'dashboard.activeJobs.match.naValue',
    score: null,
  };
};

const resolveCta = (job: JobDescription, missing: JobMaterialKey[]) => {
  if (job.status !== 'analyzed') {
    return {
      labelKey: 'dashboard.activeJobs.cta.generateMatch',
      to: `/jobs/${job.id}/match`,
    };
  }

  if (missing.includes('cv')) {
    return {
      labelKey: 'dashboard.activeJobs.cta.generateCv',
      to: `/applications/cv/new?jobId=${job.id}`,
    };
  }
  if (missing.includes('coverLetter')) {
    return {
      labelKey: 'dashboard.activeJobs.cta.generateCoverLetter',
      to: `/applications/cover-letters/new?jobId=${job.id}`,
    };
  }
  if (missing.includes('speech')) {
    return {
      labelKey: 'dashboard.activeJobs.cta.generateSpeech',
      to: `/applications/speech?jobId=${job.id}`,
    };
  }

  return {
    labelKey: 'dashboard.activeJobs.cta.reviewMatch',
    to: `/jobs/${job.id}/match`,
  };
};

export function useActiveJobsDashboard() {
  const jobAnalysis = useJobAnalysis();
  const cvDocuments = useCvDocuments();
  const coverLetters = useCoverLetters();
  const speechBlocks = useSpeechBlocks();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const loaded = ref(false);

  const load = async () => {
    if (loading.value || loaded.value) {
      return;
    }
    loading.value = true;
    error.value = null;

    try {
      await Promise.all([
        jobAnalysis.listJobs(),
        cvDocuments.loadAll(),
        coverLetters.loadAll(),
        speechBlocks.loadAll(),
      ]);
      loaded.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      loading.value = false;
    }
  };

  const jobs = computed(() => jobAnalysis.jobs.value ?? []);

  const states = computed<JobApplicationState[]>(() => {
    const cvItems = (cvDocuments.items.value ?? []) as CVDocument[];
    const coverItems = (coverLetters.items.value ?? []) as CoverLetter[];
    const speechItems = (speechBlocks.items.value ?? []) as SpeechBlock[];

    const mapped = jobs.value.map((job) => {
      const jobId = job.id;
      const materials = {
        cv: hasJobMaterial(cvItems, jobId),
        coverLetter: hasJobMaterial(coverItems, jobId),
        speech: hasJobMaterial(speechItems, jobId),
      };

      const materialsMissing = (Object.keys(materials) as JobMaterialKey[]).filter(
        (key) => !materials[key]
      );

      const match = resolveMatchStatus(job as JobDescription & {
        matchingSummaries?: MatchingSummaryLite[] | null;
      });
      return {
        jobId,
        title: job.title ?? '',
        companyName: (job as JobDescription & { company?: { companyName?: string | null } })
          .company?.companyName ?? null,
        matchStatus: match.status,
        matchLabelKey: match.labelKey,
        matchLabelParams: match.labelParams,
        matchScore: match.score ?? null,
        materials,
        materialsMissing,
        cta: resolveCta(job, materialsMissing),
      };
    });

    const sorted = [...mapped].sort((a, b) => {
      const jobA = jobs.value.find((job) => job.id === a.jobId);
      const jobB = jobs.value.find((job) => job.id === b.jobId);
      const aIncomplete =
        a.matchStatus !== 'ready' || a.materialsMissing.length > 0 ? 1 : 0;
      const bIncomplete =
        b.matchStatus !== 'ready' || b.materialsMissing.length > 0 ? 1 : 0;
      if (aIncomplete !== bIncomplete) {
        return bIncomplete - aIncomplete;
      }
      const timeA = toTimestamp(jobA?.updatedAt ?? jobA?.createdAt);
      const timeB = toTimestamp(jobB?.updatedAt ?? jobB?.createdAt);
      return timeB - timeA;
    });

    return sorted.slice(0, MAX_ACTIVE_JOBS);
  });

  return {
    states,
    loading,
    error,
    load,
  };
}
