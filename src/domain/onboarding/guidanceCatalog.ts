import type { UserProgressState } from './types';

export type GuidanceRouteKey =
  | 'profile'
  | 'profile-experiences'
  | 'profile-stories'
  | 'profile-canvas'
  | 'jobs'
  | 'job-detail'
  | 'applications-cv'
  | 'applications-cover-letters'
  | 'applications-speech';

export type GuidanceContext = {
  experiencesCount?: number;
  storiesCount?: number;
  canvasCount?: number;
  jobsCount?: number;
  hasMatchingSummary?: boolean;
  cvCount?: number;
  coverLetterCount?: number;
  speechCount?: number;
  jobId?: string;
  isGenerating?: boolean;
};

export type GuidanceCTA = {
  labelKey: string;
  to: string;
};

export type GuidanceBanner = {
  titleKey: string;
  descriptionKey: string;
  cta?: GuidanceCTA;
};

export type GuidanceEmptyState = {
  titleKey: string;
  descriptionKey: string;
  icon?: string;
  cta: GuidanceCTA;
};

export type LockedFeature = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  cta: GuidanceCTA;
};

export type GuidanceModel = {
  banner?: GuidanceBanner;
  emptyState?: GuidanceEmptyState;
  lockedFeatures?: LockedFeature[];
};

const isPhase4Unlocked = (state?: UserProgressState | null) =>
  Boolean(state?.phase3.isComplete && state?.phase2.isComplete);

const getPhase2Banner = (state: UserProgressState): GuidanceBanner => {
  if (state.phase2.missing.includes('profileDepth')) {
    return {
      titleKey: 'guidance.applications.banner.profileDepth.title',
      descriptionKey: 'guidance.applications.banner.profileDepth.description',
      cta: {
        labelKey: 'guidance.applications.banner.profileDepth.cta',
        to: '/profile/full?mode=edit',
      },
    };
  }

  if (state.phase2.missing.includes('stories')) {
    return {
      titleKey: 'guidance.applications.banner.stories.title',
      descriptionKey: 'guidance.applications.banner.stories.description',
      cta: {
        labelKey: 'guidance.applications.banner.stories.cta',
        to: '/profile/stories',
      },
    };
  }

  return {
    titleKey: 'guidance.applications.banner.canvas.title',
    descriptionKey: 'guidance.applications.banner.canvas.description',
    cta: {
      labelKey: 'guidance.applications.banner.canvas.cta',
      to: '/profile/canvas',
    },
  };
};

const getPhase3Banner = (state: UserProgressState): GuidanceBanner => {
  if (state.phase3.missing.includes('jobUploaded')) {
    return {
      titleKey: 'guidance.applications.banner.job.title',
      descriptionKey: 'guidance.applications.banner.job.description',
      cta: {
        labelKey: 'guidance.applications.banner.job.cta',
        to: '/jobs/new',
      },
    };
  }

  return {
    titleKey: 'guidance.applications.banner.matchingSummary.title',
    descriptionKey: 'guidance.applications.banner.matchingSummary.description',
    cta: {
      labelKey: 'guidance.applications.banner.matchingSummary.cta',
      to: '/jobs',
    },
  };
};

const getCanvasUnlockCta = (
  state: UserProgressState
): { descriptionKey: string; cta: GuidanceCTA } => {
  if (state.phase1.missing.includes('cvUploaded')) {
    return {
      descriptionKey: 'guidance.profile.banner.cv.title',
      cta: {
        labelKey: 'guidance.profile.banner.cv.cta',
        to: '/onboarding',
      },
    };
  }
  if (state.phase1.missing.includes('experienceCount')) {
    return {
      descriptionKey: 'guidance.profile.banner.experiences.title',
      cta: {
        labelKey: 'guidance.profile.banner.experiences.cta',
        to: '/profile/experiences/new',
      },
    };
  }
  if (state.phase2.missing.includes('profileDepth')) {
    return {
      descriptionKey: 'guidance.profileCanvas.locked.descriptionProfileDepth',
      cta: {
        labelKey: 'guidance.profileCanvas.locked.ctaProfileDepth',
        to: '/profile/full?mode=edit',
      },
    };
  }

  return {
    descriptionKey: 'guidance.profileCanvas.locked.descriptionStories',
    cta: {
      labelKey: 'guidance.profileCanvas.locked.ctaStories',
      to: '/profile/stories/new',
    },
  };
};

const getProfileGuidance = (state: UserProgressState | null): GuidanceModel => {
  if (!state) {
    return {};
  }

  if (state.phase1.missing.includes('cvUploaded')) {
    return {
      banner: {
        titleKey: 'guidance.profile.banner.cv.title',
        descriptionKey: 'guidance.profile.banner.cv.description',
        cta: {
          labelKey: 'guidance.profile.banner.cv.cta',
          to: '/onboarding',
        },
      },
    };
  }

  if (state.phase1.missing.includes('profileBasics')) {
    return {
      banner: {
        titleKey: 'guidance.profile.banner.basics.title',
        descriptionKey: 'guidance.profile.banner.basics.description',
        cta: {
          labelKey: 'guidance.profile.banner.basics.cta',
          to: '/profile/full?mode=edit',
        },
      },
    };
  }

  if (state.phase1.missing.includes('experienceCount')) {
    return {
      banner: {
        titleKey: 'guidance.profile.banner.experiences.title',
        descriptionKey: 'guidance.profile.banner.experiences.description',
        cta: {
          labelKey: 'guidance.profile.banner.experiences.cta',
          to: '/profile/experiences/new',
        },
      },
    };
  }

  if (!state.phase1.isComplete || state.phase2.isComplete) {
    return {};
  }

  if (state.phase2.missing.includes('profileDepth')) {
    return {
      banner: {
        titleKey: 'guidance.profile.banner.profileDepth.title',
        descriptionKey: 'guidance.profile.banner.profileDepth.description',
        cta: {
          labelKey: 'guidance.profile.banner.profileDepth.cta',
          to: '/profile/full?mode=edit',
        },
      },
    };
  }

  if (state.phase2.missing.includes('stories')) {
    return {
      banner: {
        titleKey: 'guidance.profile.banner.stories.title',
        descriptionKey: 'guidance.profile.banner.stories.description',
        cta: {
          labelKey: 'guidance.profile.banner.stories.cta',
          to: '/profile/stories/new',
        },
      },
    };
  }

  if (state.phase2.missing.includes('personalCanvas')) {
    return {
      banner: {
        titleKey: 'guidance.profile.banner.personalCanvas.title',
        descriptionKey: 'guidance.profile.banner.personalCanvas.description',
        cta: {
          labelKey: 'guidance.profile.banner.personalCanvas.cta',
          to: '/profile/canvas',
        },
      },
    };
  }

  return {};
};

const getProfileExperiencesGuidance = (state: UserProgressState | null): GuidanceModel => {
  let emptyState;
  if (state?.phase1.missing.includes('cvUploaded')) {
    return {
      banner: {
        titleKey: 'guidance.profileExperiences.banner.cv.title',
        descriptionKey: 'guidance.profileExperiences.banner.cv.description',
        cta: {
          labelKey: 'guidance.profileExperiences.banner.cv.cta',
          to: '/onboarding',
        },
      },
      emptyState,
    };
  }

  if (state?.phase1.missing.includes('experienceCount')) {
    return {
      banner: {
        titleKey: 'guidance.profileExperiences.banner.experience.title',
        descriptionKey: 'guidance.profileExperiences.banner.experience.description',
        cta: {
          labelKey: 'guidance.profileExperiences.banner.experience.cta',
          to: '/profile/experiences/new',
        },
      },
      emptyState,
    };
  }

  return {};
};

const getProfileStoriesGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  if (state?.phase1.missing.includes('cvUploaded')) {
    return {
      lockedFeatures: [
        {
          id: 'stories-locked',
          titleKey: 'guidance.profileStories.locked.title',
          descriptionKey: 'guidance.profileExperiences.banner.cv.title',
          cta: {
            labelKey: 'guidance.profileExperiences.banner.cv.cta',
            to: '/onboarding',
          },
        },
      ],
    };
  }
  if (state?.phase1.missing.includes('experienceCount')) {
    return {
      lockedFeatures: [
        {
          id: 'stories-locked',
          titleKey: 'guidance.profileStories.locked.title',
          descriptionKey: 'guidance.profileStories.locked.description',
          cta: {
            labelKey: 'guidance.profileStories.locked.cta',
            to: '/profile/experiences',
          },
        },
      ],
    };
  }

  if (context.storiesCount !== 0 || !state) {
    return {};
  }

  return {
    emptyState: {
      titleKey: 'guidance.profileStories.empty.title',
      descriptionKey: 'guidance.profileStories.empty.description',
      icon: 'i-heroicons-star',
      cta: {
        labelKey: 'guidance.profileStories.empty.cta',
        to: '/profile/stories/new',
      },
    },
  };
};

const getProfileCanvasGuidance = (state: UserProgressState | null): GuidanceModel => {
  if (!state) {
    return {};
  }

  if (!state.phase2.missing.includes('profileDepth') && !state.phase2.missing.includes('stories')) {
    return {};
  }

  const unlock = getCanvasUnlockCta(state);
  return {
    lockedFeatures: [
      {
        id: 'canvas',
        titleKey: 'guidance.profileCanvas.locked.title',
        descriptionKey: unlock.descriptionKey,
        cta: unlock.cta,
      },
    ],
  };
};

const getJobsGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  const emptyState =
    context.jobsCount === 0
      ? {
          titleKey: 'guidance.jobs.empty.title',
          descriptionKey: 'guidance.jobs.empty.description',
          icon: 'i-heroicons-briefcase',
          cta: {
            labelKey: 'guidance.jobs.empty.cta',
            to: '/jobs/new',
          },
        }
      : undefined;

  const buildMatchMissingBanner = (jobId: string): GuidanceModel => ({
    banner: {
      titleKey: 'guidance.jobs.banner.matchMissing.title',
      descriptionKey: 'guidance.jobs.banner.matchMissing.description',
      cta: {
        labelKey: 'guidance.jobs.banner.matchMissing.cta',
        to: `/jobs/${jobId}/match`,
      },
    },
  });

  const buildMaterialsBanner = (jobId: string): GuidanceModel => {
    const missing = state?.phase4.missing ?? [];
    const firstMissing = missing.includes('tailoredCv')
      ? 'tailoredCv'
      : missing.includes('tailoredCoverLetter')
        ? 'tailoredCoverLetter'
        : missing.includes('tailoredSpeech')
          ? 'tailoredSpeech'
          : null;

    if (!firstMissing) {
      return {};
    }

    const target =
      firstMissing === 'tailoredCv'
        ? '/applications/cv/new'
        : firstMissing === 'tailoredCoverLetter'
          ? '/applications/cover-letters/new'
          : '/applications/speech/new';

    const labelKey =
      firstMissing === 'tailoredCv'
        ? 'tailoredMaterials.materials.generateCv'
        : firstMissing === 'tailoredCoverLetter'
          ? 'tailoredMaterials.materials.generateCoverLetter'
          : 'tailoredMaterials.materials.generateSpeech';

    return {
      banner: {
        titleKey: 'guidance.jobs.materials.title',
        descriptionKey: 'guidance.jobs.materials.description',
        cta: {
          labelKey,
          to: `${target}?jobId=${jobId}`,
        },
      },
    };
  };

  if (state && !state.phase2.isComplete) {
    return {
      banner: getPhase2Banner(state),
      emptyState,
    };
  }

  if (context.jobsCount !== 0 && context.jobId) {
    if (state?.phase3.missing.includes('matchingSummary')) {
      return buildMatchMissingBanner(context.jobId);
    }

    if (state?.phase3.isComplete && !state.phase4.isComplete) {
      return buildMaterialsBanner(context.jobId);
    }
  }

  return context.jobsCount !== 0 ? {} : { emptyState };
};

const getJobDetailGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  if (!context.jobId) {
    return {};
  }

  if (context.hasMatchingSummary === false) {
    if (state && !state.phase2.isComplete) {
      return {
        banner: getPhase2Banner(state),
      };
    }

    if (!state?.phase3.missing.includes('matchingSummary')) {
      return {};
    }

    return {
      banner: {
        titleKey: 'guidance.jobDetail.banner.title',
        descriptionKey: 'guidance.jobDetail.banner.description',
        cta: {
          labelKey: 'guidance.jobDetail.banner.cta',
          to: `/jobs/${context.jobId}/match`,
        },
      },
    };
  }

  return {};
};

const getApplicationsLocked = (state: UserProgressState | null, id: string): LockedFeature[] => {
  if (!state || state.phase1.isComplete) {
    return [];
  }

  return [
    {
      id,
      titleKey: 'guidance.applications.lockedPhase1.title',
      descriptionKey: 'guidance.applications.lockedPhase1.description',
      cta: {
        labelKey: 'guidance.applications.lockedPhase1.cta',
        to: '/profile/experiences',
      },
    },
  ];
};

const getApplicationsPhase2anner = (
  state: UserProgressState | null
): GuidanceBanner | undefined => {
  if (!state || !state.phase1.isComplete || isPhase4Unlocked(state)) {
    return undefined;
  }

  if (!state.phase2.isComplete) {
    return getPhase2Banner(state);
  }

  if (!state.phase3.isComplete) {
    return getPhase3Banner(state);
  }

  return {
    titleKey: 'guidance.applications.banner.default.title',
    descriptionKey: 'guidance.applications.banner.default.description',
    cta: {
      labelKey: 'guidance.applications.banner.default.cta',
      to: '/jobs',
    },
  };
};

const getApplicationsCvGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  const lockedFeatures = getApplicationsLocked(state, 'cv-locked');
  const banner = getApplicationsPhase2anner(state);
  if (context.cvCount !== 0) {
    if (lockedFeatures.length) {
      return { lockedFeatures };
    }
    return banner ? { banner } : {};
  }

  if (lockedFeatures.length) {
    return { lockedFeatures };
  }
  const emptyState = {
    titleKey: 'guidance.applications.cv.empty.title',
    descriptionKey: 'guidance.applications.cv.empty.description',
    icon: 'i-heroicons-document-text',
    cta: {
      labelKey: 'guidance.applications.cv.empty.cta',
      to: '/applications/cv/new',
    },
  };
  return banner ? { banner, emptyState } : { emptyState };
};

const getApplicationsCoverLettersGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  const lockedFeatures = getApplicationsLocked(state, 'cover-letters-locked');
  const banner = getApplicationsPhase2anner(state);
  if (context.coverLetterCount !== 0) {
    if (lockedFeatures.length) {
      return { lockedFeatures };
    }
    return banner ? { banner } : {};
  }

  if (lockedFeatures.length) {
    return { lockedFeatures };
  }

  const emptyState = {
    titleKey: 'guidance.applications.coverLetters.empty.title',
    descriptionKey: 'guidance.applications.coverLetters.empty.description',
    icon: 'i-heroicons-envelope',
    cta: {
      labelKey: 'guidance.applications.coverLetters.empty.cta',
      to: '/applications/cover-letters/new',
    },
  };
  return banner ? { banner, emptyState } : { emptyState };
};

const getApplicationsSpeechGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  const lockedFeatures = getApplicationsLocked(state, 'speech-locked');
  const banner = getApplicationsPhase2anner(state);
  if (context.speechCount !== 0) {
    if (lockedFeatures.length) {
      return { lockedFeatures };
    }
    return banner ? { banner } : {};
  }

  if (lockedFeatures.length) {
    return { lockedFeatures };
  }

  const emptyState = {
    titleKey: 'guidance.applications.speech.empty.title',
    descriptionKey: 'guidance.applications.speech.empty.description',
    icon: 'i-heroicons-chat-bubble-left-right',
    cta: {
      labelKey: 'guidance.applications.speech.empty.cta',
      to: '/applications/speech/new',
    },
  };
  return banner ? { banner, emptyState } : { emptyState };
};

const guidanceHandlers: Record<
  GuidanceRouteKey,
  (state: UserProgressState | null, context: GuidanceContext) => GuidanceModel
> = {
  profile: (state) => getProfileGuidance(state),
  'profile-experiences': (state) => getProfileExperiencesGuidance(state),
  'profile-stories': (state, context) => getProfileStoriesGuidance(state, context),
  'profile-canvas': (state) => getProfileCanvasGuidance(state),
  jobs: (state, context) => getJobsGuidance(state, context),
  'job-detail': (state, context) => getJobDetailGuidance(state, context),
  'applications-cv': (state, context) => getApplicationsCvGuidance(state, context),
  'applications-cover-letters': (state, context) =>
    getApplicationsCoverLettersGuidance(state, context),
  'applications-speech': (state, context) => getApplicationsSpeechGuidance(state, context),
};

export function getGuidance(
  routeKey: GuidanceRouteKey,
  state: UserProgressState | null,
  context: GuidanceContext = {}
): GuidanceModel {
  return guidanceHandlers[routeKey]?.(state, context) ?? {};
}
