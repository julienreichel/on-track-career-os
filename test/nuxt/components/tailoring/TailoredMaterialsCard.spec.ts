import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import TailoredMaterialsCard from '@/components/tailoring/TailoredMaterialsCard.vue';

const pushMock = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const loadExistingMaterialsForJob = vi.fn();
const generateTailoredCvForJob = vi.fn();
const generateTailoredCoverLetterForJob = vi.fn();
const generateTailoredSpeechForJob = vi.fn();

vi.mock('@/application/tailoring/useTailoredMaterials', () => ({
  useTailoredMaterials: () => ({
    isGenerating: ref(false),
    error: ref<string | null>(null),
    materialsLoading: ref(false),
    materialsError: ref<null | string>(null),
    loadExistingMaterialsForJob,
    generateTailoredCvForJob,
    generateTailoredCoverLetterForJob,
    generateTailoredSpeechForJob,
  }),
}));

const stubs = {
  UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}</div>',
  },
  UButton: {
    props: ['label', 'disabled', 'loading'],
    template:
      '<button type="button" :disabled="disabled || loading" @click="$emit(\'click\')">{{ label }}</button>',
  },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
};

const baseJob = {
  id: 'job-1',
  title: 'Lead Engineer',
};

const baseSummary = {
  overallScore: 80,
  scoreBreakdown: {
    skillFit: 30,
    experienceFit: 25,
    interestFit: 15,
    edge: 10,
  },
  recommendation: 'apply',
  reasoningHighlights: ['Strong alignment'],
  strengthsForThisRole: ['Leadership'],
  skillMatch: ['[MATCH] Leadership — led teams'],
  riskyPoints: ['Risk: limited fintech'],
  impactOpportunities: ['Improve velocity'],
  tailoringTips: ['Highlight mentorship'],
};

describe('TailoredMaterialsCard', () => {
  beforeEach(() => {
    pushMock.mockReset();
    loadExistingMaterialsForJob.mockReset();
    generateTailoredCvForJob.mockReset();
    generateTailoredCoverLetterForJob.mockReset();
    generateTailoredSpeechForJob.mockReset();
  });

  it('shows missing summary hint when no summary and no existing materials', async () => {
    loadExistingMaterialsForJob.mockResolvedValue({
      ok: true,
      data: { cv: null, coverLetter: null, speechBlock: null },
    });

    const wrapper = mount(TailoredMaterialsCard, {
      props: {
        job: baseJob,
        matchingSummary: null,
        matchLink: '/jobs/job-1/match',
      },
      global: { plugins: [createTestI18n()], stubs },
    });

    await flushPromises();
    expect(wrapper.text()).toContain('Generate a matching summary first');
  });

  it('renders view buttons when existing materials are present', async () => {
    loadExistingMaterialsForJob.mockResolvedValue({
      ok: true,
      data: {
        cv: { id: 'cv-1' },
        coverLetter: { id: 'cl-1' },
        speechBlock: { id: 'sb-1' },
      },
    });

    const wrapper = mount(TailoredMaterialsCard, {
      props: {
        job: baseJob,
        matchingSummary: baseSummary,
      },
      global: { plugins: [createTestI18n()], stubs },
    });

    await flushPromises();
    expect(wrapper.text()).toContain('View CV');
    expect(wrapper.text()).toContain('View cover letter');
    expect(wrapper.text()).toContain('View speech');
  });

  it('generates CV and navigates to the new document', async () => {
    loadExistingMaterialsForJob.mockResolvedValue({
      ok: true,
      data: { cv: null, coverLetter: null, speechBlock: null },
    });

    const wrapper = mount(TailoredMaterialsCard, {
      props: {
        job: baseJob,
        matchingSummary: baseSummary,
      },
      global: { plugins: [createTestI18n()], stubs },
    });

    await flushPromises();
    const buttons = wrapper.findAll('button');
    const generateCvButton = buttons.find((button) =>
      button.text().includes('Generate tailored CV')
    );
    if (!generateCvButton) {
      throw new Error('Expected generate CV button');
    }

    await generateCvButton.trigger('click');
    expect(pushMock).toHaveBeenCalledWith('/applications/cv/new?jobId=job-1');
  });

  it('uses provided existing materials without loading', async () => {
    const wrapper = mount(TailoredMaterialsCard, {
      props: {
        job: baseJob,
        matchingSummary: baseSummary,
        existingMaterials: {
          cv: { id: 'cv-1' },
          coverLetter: { id: 'cl-1' },
          speechBlock: { id: 'sb-1' },
        },
      },
      global: { plugins: [createTestI18n()], stubs },
    });

    await flushPromises();
    expect(loadExistingMaterialsForJob).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('View CV');
    expect(wrapper.text()).toContain('View cover letter');
    expect(wrapper.text()).toContain('View speech');
  });
});
