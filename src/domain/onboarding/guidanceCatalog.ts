import type { UserProgressState } from './types';

export type GuidanceRouteKey =
  | 'profile'
  | 'profile-experiences'
  | 'profile-stories'
  | 'profile-canvas'
  | 'jobs'
  | 'job-match'
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
          to: '/profile/cv-upload',
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

const getProfileExperiencesGuidance = (
  state: UserProgressState | null,
  context: GuidanceContext
): GuidanceModel => {
  let emptyState;
  if (context.experiencesCount === 0) {
    emptyState = {
      titleKey: 'guidance.profileExperiences.empty.title',
      descriptionKey: 'guidance.profileExperiences.empty.description',
      icon: 'i-heroicons-briefcase',
      cta: {
        labelKey: 'guidance.profileExperiences.empty.cta',
        to: '/profile/experiences/new',
      },
    };
  }
  if (state?.phase1.missing.includes('cvUploaded')) {
    return {
      banner: {
        titleKey: 'guidance.profileExperiences.banner.cv.title',
        descriptionKey: 'guidance.profileExperiences.banner.cv.description',
        cta: {
          labelKey: 'guidance.profileExperiences.banner.cv.cta',
          to: '/profile/cv-upload',
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

const getJobsGuidance = (context: GuidanceContext): GuidanceModel => {
  if (context.jobsCount !== 0) {
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

const getJobMatchGuidance = (context: GuidanceContext): GuidanceModel => {
  if (context.hasMatchingSummary !== false || context.isGenerating || !context.jobId) {
    return {};
  }

  return {
    banner: {
      titleKey: 'guidance.jobMatch.banner.title',
      descriptionKey: 'guidance.jobMatch.banner.description',
      cta: {
        labelKey: 'guidance.jobMatch.banner.cta',
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
    lockedFeatures: lockedFeatures.length ? lockedFeatures : undefined,
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
    lockedFeatures: lockedFeatures.length ? lockedFeatures : undefined,
  };
};

const getApplicationsSpeechGuidance = (state: UserProgressState | null): GuidanceModel => {
  const lockedFeatures = getApplicationsLocked(state, 'speech-locked');
  return { lockedFeatures: lockedFeatures.length ? lockedFeatures : undefined };
};

const guidanceHandlers: Record<
  GuidanceRouteKey,
  (state: UserProgressState | null, context: GuidanceContext) => GuidanceModel
> = {
  profile: (state) => getProfileGuidance(state),
  'profile-experiences': (state, context) => getProfileExperiencesGuidance(state, context),
  'profile-stories': (state, context) => getProfileStoriesGuidance(state, context),
  'profile-canvas': (state) => getProfileCanvasGuidance(state),
  jobs: (_, context) => getJobsGuidance(context),
  'job-match': (_, context) => getJobMatchGuidance(context),
  'applications-cv': (state, context) => getApplicationsCvGuidance(state, context),
  'applications-cover-letters': (state, context) =>
    getApplicationsCoverLettersGuidance(state, context),
  'applications-speech': (state) => getApplicationsSpeechGuidance(state),
};

export function getGuidance(
  routeKey: GuidanceRouteKey,
  state: UserProgressState | null,
  context: GuidanceContext = {}
): GuidanceModel {
  return guidanceHandlers[routeKey]?.(state, context) ?? {};
}
