import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import MaterialFeedbackPanel from '@/components/materials/MaterialFeedbackPanel.vue';
import type { ApplicationStrengthEvaluation } from '@/domain/application-strength/ApplicationStrengthEvaluation';
import { createTestI18n } from '../../../utils/createTestI18n';

const detailsFixture: ApplicationStrengthEvaluation = {
  overallScore: 76,
  dimensionScores: {
    atsReadiness: 80,
    clarityFocus: 70,
    targetedFitSignals: 74,
    evidenceStrength: 78,
  },
  decision: {
    label: 'borderline',
    readyToApply: false,
    rationaleBullets: ['Good core fit'],
  },
  missingSignals: ['Explicit leadership metrics'],
  topImprovements: [
    {
      title: 'Strengthen opening',
      action: 'Lead with the most relevant role outcomes.',
      impact: 'high',
      target: {
        document: 'cv',
        anchor: 'summary',
      },
    },
  ],
  notes: {
    atsNotes: ['Add role keywords'],
    humanReaderNotes: ['Tighten long lines'],
  },
};

const stubs = {
  UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  UButton: {
    name: 'UButton',
    props: ['label', 'disabled', 'loading'],
    template:
      '<button type="button" :disabled="disabled || loading" @click="$emit(\'click\')" v-bind="$attrs">{{ label }}</button>',
  },
  USelectMenu: {
    name: 'USelectMenu',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="u-select-menu"></div>',
  },
  UTextarea: {
    name: 'UTextarea',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<textarea class="u-textarea" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
};

function createEngineMock(overrides?: {
  state?: 'idle' | 'analyzing' | 'ready' | 'improving' | 'error';
  score?: number | null;
  details?: ApplicationStrengthEvaluation | null;
  canImprove?: boolean;
}) {
  return {
    state: ref(overrides?.state ?? 'ready'),
    score: ref(overrides?.score ?? 76),
    details: ref(overrides?.details ?? detailsFixture),
    presets: ref<string[]>([]),
    note: ref(''),
    canImprove: ref(overrides?.canImprove ?? true),
    actions: {
      runFeedback: vi.fn().mockResolvedValue(undefined),
      runImprove: vi.fn().mockResolvedValue(undefined),
      setPresets: vi.fn(),
      setNote: vi.fn(),
    },
  };
}

function findButtonByLabel(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper
    .findAllComponents({ name: 'UButton' })
    .find((component) => component.props('label') === label);

  if (!button) {
    throw new Error(`Expected button with label: ${label}`);
  }

  return button;
}

describe('MaterialFeedbackPanel', () => {
  it('renders score-only view by default and keeps details collapsed', () => {
    const engine = createEngineMock();
    const wrapper = mount(MaterialFeedbackPanel, {
      props: {
        engine,
        materialType: 'cv',
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    expect(wrapper.get('[data-testid="material-feedback-score"]').text()).toBe('76');
    expect(wrapper.find('[data-testid="material-feedback-details"]').exists()).toBe(false);
  });

  it('expands details only when user toggles it', async () => {
    const engine = createEngineMock();
    const wrapper = mount(MaterialFeedbackPanel, {
      props: {
        engine,
        materialType: 'cv',
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    const toggleButton = findButtonByLabel(wrapper, 'Show details');
    toggleButton.vm.$emit('click');
    await nextTick();

    expect(wrapper.find('[data-testid="material-feedback-details"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Explicit leadership metrics');
    expect(wrapper.text()).toContain('Strengthen opening');
  });

  it('updates presets and note through engine actions', async () => {
    const engine = createEngineMock();
    const wrapper = mount(MaterialFeedbackPanel, {
      props: {
        engine,
        materialType: 'coverLetter',
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    wrapper
      .findComponent({ name: 'USelectMenu' })
      .vm.$emit('update:modelValue', ['quantified-impact']);
    await wrapper.find('textarea').setValue('focus on concise bullets');

    expect(engine.actions.setPresets).toHaveBeenCalledWith(['quantified-impact']);
    expect(engine.actions.setNote).toHaveBeenCalledWith('focus on concise bullets');
  });

  it('disables improve when no feedback or when busy, and executes callbacks', async () => {
    const noFeedbackEngine = createEngineMock({
      details: null,
      score: null,
      canImprove: false,
      state: 'idle',
    });

    const noFeedbackWrapper = mount(MaterialFeedbackPanel, {
      props: {
        engine: noFeedbackEngine,
        materialType: 'cv',
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    const noFeedbackImproveButton = findButtonByLabel(noFeedbackWrapper, 'Improve');
    expect(noFeedbackImproveButton.props('disabled')).toBe(true);

    const busyEngine = createEngineMock({
      state: 'improving',
      canImprove: true,
    });
    const busyWrapper = mount(MaterialFeedbackPanel, {
      props: {
        engine: busyEngine,
        materialType: 'cv',
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    const feedbackButton = findButtonByLabel(busyWrapper, 'Get feedback');
    const improveButton = findButtonByLabel(busyWrapper, 'Improving...');
    expect(improveButton.props('disabled')).toBe(true);
    expect(feedbackButton.props('disabled')).toBe(true);

    const readyEngine = createEngineMock();
    const readyWrapper = mount(MaterialFeedbackPanel, {
      props: {
        engine: readyEngine,
        materialType: 'cv',
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    const readyFeedbackButton = findButtonByLabel(readyWrapper, 'Get feedback');
    const readyImproveButton = findButtonByLabel(readyWrapper, 'Improve');

    readyFeedbackButton.vm.$emit('click');
    readyImproveButton.vm.$emit('click');

    expect(readyEngine.actions.runFeedback).toHaveBeenCalledTimes(1);
    expect(readyEngine.actions.runImprove).toHaveBeenCalledTimes(1);
  });
});
