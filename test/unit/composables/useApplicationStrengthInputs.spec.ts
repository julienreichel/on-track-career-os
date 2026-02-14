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
  const candidateFullName = ref('');

  beforeEach(() => {
    vi.clearAllMocks();
    candidateFullName.value = '';
  });

  it('populates extracted text from uploaded PDF', async () => {
    const state = useApplicationStrengthInputs({ candidateFullName });
    const file = new File(['pdf bytes'], 'cv.pdf', { type: 'application/pdf' });

    await state.handleFileUpload(file);

    expect(PDFParse).toHaveBeenCalled();
    expect(state.extractedText.value).toBe('Extracted PDF text');
  });

  it('detects cv when name appears near beginning', () => {
    candidateFullName.value = 'Jane Doe';
    const state = useApplicationStrengthInputs({ candidateFullName });

    state.pastedText.value = 'Jane Doe\nProduct Manager\nExperience...';

    expect(state.pastedType.value).toBe('cv');
    expect(state.cvText.value.length).toBeGreaterThan(0);
    expect(state.coverLetterText.value).toBe('');
  });

  it('detects cover letter when name appears near end', () => {
    candidateFullName.value = 'Jane Doe';
    const state = useApplicationStrengthInputs({ candidateFullName });

    state.pastedText.value = 'Dear Hiring Team,\nI am applying for the role.\nBest regards,\nJane Doe';

    expect(state.pastedType.value).toBe('coverLetter');
    expect(state.coverLetterText.value.length).toBeGreaterThan(0);
    expect(state.cvText.value).toBe('');
  });

  it('falls back to cv when contact info exists and name not found', () => {
    const state = useApplicationStrengthInputs({ candidateFullName });

    state.pastedText.value =
      'Profile\nExperienced engineer\nEmail: test@example.com\nPhone: +33 6 12 34 56 78';

    expect(state.pastedType.value).toBe('cv');
  });
});
