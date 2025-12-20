import { describe, it, expect } from 'vitest';

/**
 * Extracted function for testing
 * This mirrors the stripTrailingNotes function in generateCv.ts
 */
function stripTrailingNotes(cvText: string): string {
  // Match separator line followed by note/notes (case insensitive)
  const notePattern = /\n---+\s*\n[\s\S]*?\b(note|notes)\b:?.*/i;
  const match = cvText.match(notePattern);

  if (match) {
    // Remove everything from the separator onwards
    const cleanedText = cvText.substring(0, match.index);
    return cleanedText.trim();
  }

  return cvText;
}

function stripCodeFences(cvText: string): string {
  const trimmed = cvText.trim();
  const fencePattern = /^```[a-zA-Z0-9-]*\s*[\r\n]+([\s\S]*?)\s*```$/;
  const match = trimmed.match(fencePattern);
  if (match) {
    return match[1].trimEnd();
  }

  const withoutLeadingFence = trimmed.replace(/^```[a-zA-Z0-9-]*\s*[\r\n]*/, '');
  const withoutTrailingFence = withoutLeadingFence.replace(/[\r\n]*```$/, '');
  return withoutTrailingFence;
}

describe('generateCv - stripTrailingNotes', () => {
  it('should remove trailing note with separator', () => {
    const cvWithNote = `# John Doe

## Work Experience

### Senior Engineer
**Acme Corp**
- Led development team
- Shipped major features

---

**Note:** This CV is tailored to highlight experiences and skills relevant to the Head of Engineering position at Bigblue, emphasizing leadership, technical depth, and people management.`;

    const cleaned = stripTrailingNotes(cvWithNote);

    expect(cleaned).not.toContain('Note:');
    expect(cleaned).not.toContain('---');
    expect(cleaned).toContain('Shipped major features');
    expect(cleaned.trim().endsWith('major features')).toBe(true);
  });

  it('should remove trailing notes (lowercase)', () => {
    const cvWithNote = `# Jane Smith

## Skills
- JavaScript
- Python

---

note: This document was generated based on provided information.`;

    const cleaned = stripTrailingNotes(cvWithNote);

    expect(cleaned).not.toContain('note:');
    expect(cleaned).not.toContain('---');
    expect(cleaned).toContain('Python');
  });

  it('should handle "Notes:" plural', () => {
    const cvWithNote = `# CV Content

Some content here

---

Notes:
- Additional info
- More details`;

    const cleaned = stripTrailingNotes(cvWithNote);

    expect(cleaned).not.toContain('Notes:');
    expect(cleaned).not.toContain('Additional info');
  });

  it('should handle multiple dashes in separator', () => {
    const cvWithNote = `# CV Content

Work experience here

-----

**NOTE:** Tailored for specific role`;

    const cleaned = stripTrailingNotes(cvWithNote);

    expect(cleaned).not.toContain('NOTE:');
    expect(cleaned).toContain('Work experience here');
  });

  it('should not remove content when no note is present', () => {
    const cvWithoutNote = `# John Doe

## Work Experience

### Senior Engineer
**Acme Corp**
- Led development team`;

    const cleaned = stripTrailingNotes(cvWithoutNote);

    expect(cleaned).toBe(cvWithoutNote);
  });

  it('should handle separator without note keyword (no removal)', () => {
    const cvWithSeparator = `# CV Content

## Section 1
Content here

---

## Section 2
More content`;

    const cleaned = stripTrailingNotes(cvWithSeparator);

    // Should keep everything since there's no "note" keyword
    expect(cleaned).toContain('Section 2');
    expect(cleaned).toContain('---');
  });

  it('should handle note without separator (no removal)', () => {
    const cvWithoutSeparator = `# CV Content

Some content
Note: This is just part of content`;

    const cleaned = stripTrailingNotes(cvWithoutSeparator);

    // Should keep everything since there's no separator before the note
    expect(cleaned).toBe(cvWithoutSeparator);
  });

  it('should handle case insensitive note variations', () => {
    const testCases = ['Note:', 'NOTE:', 'note:', 'Notes:', 'NOTES:', 'notes:', 'Note', 'NOTE'];

    testCases.forEach((noteVariation) => {
      const cv = `# CV\n\nContent\n\n---\n\n${noteVariation} Some disclaimer`;
      const cleaned = stripTrailingNotes(cv);

      expect(cleaned).not.toContain(noteVariation);
      expect(cleaned).not.toContain('disclaimer');
    });
  });

  it('should handle multiline notes', () => {
    const cvWithMultilineNote = `# CV Content

Work experience

---

**Note:** This CV is tailored for the position.
It highlights relevant skills and experiences.
Additional information about customization.`;

    const cleaned = stripTrailingNotes(cvWithMultilineNote);

    expect(cleaned).not.toContain('Note:');
    expect(cleaned).not.toContain('tailored');
    expect(cleaned).not.toContain('customization');
    expect(cleaned).toContain('Work experience');
  });

  it('should preserve legitimate content before separator', () => {
    const cv = `# John Doe
**Engineer** | john@example.com

## Summary
Experienced software engineer with 10 years in the industry.

## Work Experience

### Senior Engineer at **Tech Corp**
2020 - Present
- Led team of 5 developers
- Implemented CI/CD pipeline
- Reduced deployment time by 50%

## Skills
- JavaScript, TypeScript, Python
- AWS, Docker, Kubernetes

---

Note: This CV emphasizes cloud and DevOps experience.`;

    const cleaned = stripTrailingNotes(cv);

    // Should preserve all CV content
    expect(cleaned).toContain('John Doe');
    expect(cleaned).toContain('Experienced software engineer');
    expect(cleaned).toContain('Senior Engineer');
    expect(cleaned).toContain('AWS, Docker, Kubernetes');

    // Should remove note
    expect(cleaned).not.toContain('Note:');
    expect(cleaned).not.toContain('emphasizes cloud');

    // Should not end with separator
    expect(cleaned.trim().endsWith('---')).toBe(false);
  });
});

describe('generateCv - stripCodeFences', () => {
  it('should remove fenced code block with language', () => {
    const fenced = '```markdown\n# Title\n\nContent\n```';
    expect(stripCodeFences(fenced)).toBe('# Title\n\nContent');
  });

  it('should remove fenced code block without language', () => {
    const fenced = '```\n# Title\nContent\n```';
    expect(stripCodeFences(fenced)).toBe('# Title\nContent');
  });

  it('should handle missing starting fence gracefully', () => {
    const text = '# Title\nContent\n```';
    expect(stripCodeFences(text)).toBe('# Title\nContent');
  });

  it('should handle trailing fence with trailing whitespace', () => {
    const fenced = '```markdown\n# Title\nContent\n```\n';
    expect(stripCodeFences(fenced)).toBe('# Title\nContent');
  });

  it('should handle carriage returns in fences', () => {
    const fenced = '```markdown\r\n# Title\r\n\r\nContent\r\n```\r\n';
    expect(stripCodeFences(fenced)).toBe('# Title\r\n\r\nContent');
  });
});
