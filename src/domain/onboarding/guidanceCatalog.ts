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

const isPhase3Unlocked = (state?: UserProgressState | null) =>
  Boolean(state?.phase2A.isComplete && state?.phase2B.isComplete);

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
  if (state.phase2A.missing.includes('profileDepth')) {
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

  if (!state.phase1.isComplete || state.phase2B.isComplete) {
    return {};
  }

  if (state.phase2B.missing.includes('profileDepth')) {
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

  if (state.phase2B.missing.includes('stories')) {
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

  if (state.phase2B.missing.includes('personalCanvas')) {
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

  if (
    !state.phase2B.missing.includes('profileDepth') &&
    !state.phase2B.missing.includes('stories')
  ) {
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
  if (context.jobsCount !== 0) {
    if (
      context.jobId &&
      context.hasMatchingSummary === false &&
      state?.phase2A.missing.includes('matchingSummary')
    ) {
      return {
        banner: {
          titleKey: 'guidance.jobs.banner.matchMissing.title',
          descriptionKey: 'guidance.jobs.banner.matchMissing.description',
          cta: {
            labelKey: 'guidance.jobs.banner.matchMissing.cta',
            to: `/jobs/${context.jobId}/match`,
          },
        },
      };
    }

    return {};
  }

  return {
    emptyState: {
      titleKey: 'guidance.jobs.empty.title',
      descriptionKey: 'guidance.jobs.empty.description',
      icon: 'i-heroicons-briefcase',
      cta: {
        labelKey: 'guidance.jobs.empty.cta',
        to: '/jobs/new',
      },
    },
  };
};

const getJobDetailGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  if (!context.jobId || context.hasMatchingSummary !== false) {
    return {};
  }

  if (!state?.phase2A.missing.includes('matchingSummary')) {
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
};

const getApplicationsLocked = (state: UserProgressState | null, id: string): LockedFeature[] => {
  if (!state) {
    return [];
  }

  if (!state.phase1.isComplete) {
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
  }

  if (isPhase3Unlocked(state)) {
    return [];
  }

  if (state.phase2B.missing.includes('profileDepth')) {
    return [
      {
        id,
        titleKey: 'guidance.applications.lockedProfileDepth.title',
        descriptionKey: 'guidance.applications.lockedProfileDepth.description',
        cta: {
          labelKey: 'guidance.applications.lockedProfileDepth.cta',
          to: '/profile/full?mode=edit',
        },
      },
    ];
  }

  if (state.phase2B.missing.includes('stories')) {
    return [
      {
        id,
        titleKey: 'guidance.applications.lockedStories.title',
        descriptionKey: 'guidance.applications.lockedStories.description',
        cta: {
          labelKey: 'guidance.applications.lockedStories.cta',
          to: '/profile/stories',
        },
      },
    ];
  }

  if (state.phase2B.missing.includes('personalCanvas')) {
    return [
      {
        id,
        titleKey: 'guidance.applications.lockedCanvas.title',
        descriptionKey: 'guidance.applications.lockedCanvas.description',
        cta: {
          labelKey: 'guidance.applications.lockedCanvas.cta',
          to: '/profile/canvas',
        },
      },
    ];
  }

  if (state.phase2A.missing.includes('jobUploaded')) {
    return [
      {
        id,
        titleKey: 'guidance.applications.lockedJob.title',
        descriptionKey: 'guidance.applications.lockedJob.description',
        cta: {
          labelKey: 'guidance.applications.lockedJob.cta',
          to: '/jobs/new',
        },
      },
    ];
  }

  if (state.phase2A.missing.includes('matchingSummary')) {
    return [
      {
        id,
        titleKey: 'guidance.applications.lockedMatchingSummary.title',
        descriptionKey: 'guidance.applications.lockedMatchingSummary.description',
        cta: {
          labelKey: 'guidance.applications.lockedMatchingSummary.cta',
          to: '/jobs',
        },
      },
    ];
  }

  return [
    {
      id,
      titleKey: 'guidance.applications.locked.title',
      descriptionKey: 'guidance.applications.locked.description',
      cta: {
        labelKey: 'guidance.applications.locked.cta',
        to: '/jobs',
      },
    },
  ];
};

const getApplicationsCvGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  const lockedFeatures = getApplicationsLocked(state, 'cv-locked');
  if (context.cvCount !== 0) {
    return { lockedFeatures: lockedFeatures.length ? lockedFeatures : undefined };
  }

  if (lockedFeatures.length) {
    return { lockedFeatures };
  }
  return {
    emptyState: {
      titleKey: 'guidance.applications.cv.empty.title',
      descriptionKey: 'guidance.applications.cv.empty.description',
      icon: 'i-heroicons-document-text',
      cta: {
        labelKey: 'guidance.applications.cv.empty.cta',
        to: '/applications/cv/new',
      },
    },
  };
};

const getApplicationsCoverLettersGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  const lockedFeatures = getApplicationsLocked(state, 'cover-letters-locked');
  if (context.coverLetterCount !== 0) {
    return { lockedFeatures: lockedFeatures.length ? lockedFeatures : undefined };
  }

  if (lockedFeatures.length) {
    return { lockedFeatures };
  }

  return {
    emptyState: {
      titleKey: 'guidance.applications.coverLetters.empty.title',
      descriptionKey: 'guidance.applications.coverLetters.empty.description',
      icon: 'i-heroicons-envelope',
      cta: {
        labelKey: 'guidance.applications.coverLetters.empty.cta',
        to: '/applications/cover-letters/new',
      },
    },
  };
};

const getApplicationsSpeechGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  const lockedFeatures = getApplicationsLocked(state, 'speech-locked');
  if (context.speechCount !== 0) {
    return { lockedFeatures: lockedFeatures.length ? lockedFeatures : undefined };
  }

  if (lockedFeatures.length) {
    return { lockedFeatures };
  }

  return {
    emptyState: {
      titleKey: 'guidance.applications.speech.empty.title',
      descriptionKey: 'guidance.applications.speech.empty.description',
      icon: 'i-heroicons-chat-bubble-left-right',
      cta: {
        labelKey: 'guidance.applications.speech.empty.cta',
        to: '/applications/speech/new',
      },
    },
  };
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
