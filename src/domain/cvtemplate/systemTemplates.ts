export type SystemCvTemplate = {
  id: string;
  name: string;
  source: string;
  content: string;
};

export const SYSTEM_CV_TEMPLATES: SystemCvTemplate[] = [
  {
    id: 'system:classic',
    name: 'Classic',
    source: 'system:classic',
    content: `# {{fullName}}
{{headline}}

## Summary
{{summary}}

## Experience
{{experience}}

## Education
{{education}}

## Skills
{{skills}}
`,
  },
  {
    id: 'system:modern',
    name: 'Modern',
    source: 'system:modern',
    content: `# {{fullName}}
{{headline}} · {{location}}

## Impact Summary
{{summary}}

## Core Skills
{{skills}}

## Experience
{{experience}}

## Education
{{education}}
`,
  },
  {
    id: 'system:competency',
    name: 'Competency',
    source: 'system:competency',
    content: `# {{fullName}}
{{headline}}

## Profile
{{summary}}

## Competencies
{{skills}}

## Experience
{{experience}}

## Certifications
{{certifications}}
`,
  },
];
