import type { NextAction, NextActionItem, UserProgressState } from './types';

function action(id: string, labelKey: string, rationaleKey: string, to: string): NextActionItem {
  return { id, labelKey, rationaleKey, to };
}

function phase1Primary(state: UserProgressState): NextActionItem {
  if (state.phase1.missing.includes('cvUploaded')) {
    return action(
      'upload-cv',
      'progress.actions.uploadCv',
      'progress.rationale.cvUpload',
      '/profile/cv-upload'
    );
  }
  if (state.phase1.missing.includes('experienceCount')) {
    return action(
      'add-experiences',
      'progress.actions.addExperiences',
      'progress.rationale.experiences',
      '/profile/experiences'
    );
  }
  return action(
    'complete-profile',
    'progress.actions.completeProfile',
    'progress.rationale.profileBasics',
    '/profile'
  );
}

function phase2Primary(state: UserProgressState): NextActionItem {
  if (!state.phase2A.isComplete) {
    if (state.phase2A.missing.includes('profileDepth')) {
      return action(
        'profile-depth',
        'progress.actions.profileDepth',
        'progress.rationale.profileDepth',
        '/profile'
      );
    }
    if (state.phase2A.missing.includes('stories')) {
      return action(
        'add-stories',
        'progress.actions.addStories',
        'progress.rationale.stories',
        '/profile/stories'
      );
    }
    return action(
      'build-canvas',
      'progress.actions.buildCanvas',
      'progress.rationale.personalCanvas',
      '/profile/canvas'
    );
  }

  if (state.phase2B.missing.includes('jobUploaded')) {
    return action(
      'upload-job',
      'progress.actions.uploadJob',
      'progress.rationale.jobUpload',
      '/jobs/new'
    );
  }

  return action(
    'generate-match',
    'progress.actions.generateMatch',
    'progress.rationale.matchingSummary',
    '/jobs'
  );
}

function phase2Secondary(state: UserProgressState): NextActionItem[] {
  if (!state.phase2A.isComplete && state.phase2B.isComplete) {
    return [
      action(
        'profile-depth',
        'progress.actions.profileDepth',
        'progress.rationale.profileDepth',
        '/profile'
      ),
      action(
        'add-stories',
        'progress.actions.addStories',
        'progress.rationale.stories',
        '/profile/stories'
      ),
    ];
  }

  if (state.phase2A.isComplete && !state.phase2B.isComplete) {
    return [
      action(
        'upload-job',
        'progress.actions.uploadJob',
        'progress.rationale.jobUpload',
        '/jobs/new'
      ),
      action(
        'generate-match',
        'progress.actions.generateMatch',
        'progress.rationale.matchingSummary',
        '/jobs'
      ),
    ];
  }

  return [
    action(
      'profile-depth',
      'progress.actions.profileDepth',
      'progress.rationale.profileDepth',
      '/profile'
    ),
    action(
      'upload-job',
      'progress.actions.uploadJob',
      'progress.rationale.jobUpload',
      '/jobs/new'
    ),
  ];
}

function phase3Primary(): NextActionItem {
  return action(
    'tailor-materials',
    'progress.actions.tailorMaterials',
    'progress.rationale.tailoredMaterials',
    '/jobs'
  );
}

function bonusPrimary(): NextActionItem {
  return action(
    'optimize-materials',
    'progress.actions.optimizeMaterials',
    'progress.rationale.bonus',
    '/applications/cv'
  );
}

export function getNextAction(state: UserProgressState): NextAction {
  if (!state.phase1.isComplete) {
    return {
      phase: 'phase1',
      primary: phase1Primary(state),
      secondary: [],
      missingPrerequisites: state.phase1.missing,
      gateReasonKeys: state.phase1.reasonKeys,
    };
  }

  if (!state.phase2A.isComplete || !state.phase2B.isComplete) {
    return {
      phase: 'phase2',
      primary: phase2Primary(state),
      secondary: phase2Secondary(state),
      missingPrerequisites: [...state.phase2A.missing, ...state.phase2B.missing],
      gateReasonKeys: [...state.phase2A.reasonKeys, ...state.phase2B.reasonKeys],
    };
  }

  if (!state.phase3.isComplete) {
    return {
      phase: 'phase3',
      primary: phase3Primary(),
      secondary: [],
      missingPrerequisites: state.phase3.missing,
      gateReasonKeys: state.phase3.reasonKeys,
    };
  }

  return {
    phase: 'bonus',
    primary: bonusPrimary(),
    secondary: [],
    missingPrerequisites: [],
    gateReasonKeys: [],
  };
}
