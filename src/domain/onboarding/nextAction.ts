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
    '/profile/full?mode=edit'
  );
}

function phase2Primary(state: UserProgressState): NextActionItem {
  if (!state.phase2A.isComplete) {
    if (state.phase2A.missing.includes('jobUploaded')) {
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
  if (state.phase2B.missing.includes('profileDepth')) {
    return action(
      'profile-depth',
      'progress.actions.profileDepth',
      'progress.rationale.profileDepth',
      '/profile/full?mode=edit'
    );
  }
  if (state.phase2B.missing.includes('stories')) {
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
      missingPrerequisites: state.phase1.missing,
    };
  }

  if (!state.phase2B.isComplete || !state.phase2A.isComplete) {
    return {
      phase: 'phase2',
      primary: phase2Primary(state),
      missingPrerequisites: [...state.phase2B.missing, ...state.phase2A.missing],
    };
  }

  if (!state.phase3.isComplete) {
    return {
      phase: 'phase3',
      primary: phase3Primary(),
      missingPrerequisites: state.phase3.missing,
    };
  }

  return {
    phase: 'bonus',
    primary: bonusPrimary(),
    missingPrerequisites: [],
  };
}
