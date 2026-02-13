import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { PDFParse } from 'pdf-parse';
import { useApplicationStrengthInputs } from '@/composables/useApplicationStrengthInputs';

vi.mock('pdf-parse', () => ({
  PDFParse: Object.assign(
    vi.fn().mockImplementation(() => ({
      getText: vi.fn().mockResolvedValue({ text: 'Extracted PDF text' }),
      destroy: vi.fn().mockResolvedValue(undefined),
    })),
    {
      setWorker: vi.fn(),
    }
  ),
}));

describe('useApplicationStrengthInputs', () => {
  const tailoredCvText = ref('');
  const tailoredCoverLetterText = ref('');

  beforeEach(() => {
    vi.clearAllMocks();
    tailoredCvText.value = '';
    tailoredCoverLetterText.value = '';
  });

  it('populates text from uploaded PDF', async () => {
    const state = useApplicationStrengthInputs({ tailoredCvText, tailoredCoverLetterText });
    const file = new File(['pdf bytes'], 'cv.pdf', { type: 'application/pdf' });

    await state.handleFileUpload('cv', file);

    expect(PDFParse).toHaveBeenCalled();
    expect(state.extractedCvText.value).toBe('Extracted PDF text');
  });

  it('enforces canEvaluate rules for missing and provided CV text', () => {
    const state = useApplicationStrengthInputs({ tailoredCvText, tailoredCoverLetterText });

    expect(state.canEvaluate.value).toBe(false);
    expect(state.validationErrors.value).toHaveLength(1);

    state.pastedCvText.value = 'Senior software engineer with 8 years of experience.';
    expect(state.canEvaluate.value).toBe(true);
    expect(state.validationErrors.value).toHaveLength(0);
  });

  it('enables tailored tabs when content exists', () => {
    tailoredCvText.value = 'Tailored CV body';
    tailoredCoverLetterText.value = 'Tailored cover letter';

    const state = useApplicationStrengthInputs({ tailoredCvText, tailoredCoverLetterText });
    state.reset();

    expect(state.hasTailoredCv.value).toBe(true);
    expect(state.hasTailoredCoverLetter.value).toBe(true);
    expect(state.cvSourceMode.value).toBe('tailoredCv');
    expect(state.coverLetterSourceMode.value).toBe('tailoredCoverLetter');
  });
});
