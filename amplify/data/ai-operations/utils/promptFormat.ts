import type {
  CompanyProfile,
  Experience,
  JobDescription,
  MatchingSummaryContext,
  PersonalCanvas,
  Profile,
  SpeechStory,
} from '../types/schema-types';

type PromptInput = {
  language: 'en';
  profile?: Profile | null;
  experiences?: Experience[] | null;
  stories?: SpeechStory[] | null;
  personalCanvas?: PersonalCanvas | null;
  jobDescription?: JobDescription | null;
  matchingSummary?: MatchingSummaryContext | null;
  company?: CompanyProfile | null;
};

function isNonEmpty(value?: string | null): value is string {
  return Boolean(value?.trim());
}

function formatList(label: string, values?: string[] | null): string | null {
  if (!values?.length) return null;
  return `${label}: ${values.filter(isNonEmpty).join(', ')}`;
}

function formatProfile(profile?: Profile | null): string | null {
  if (!profile) return null;

  const lines: string[] = [];
  if (isNonEmpty(profile.fullName)) lines.push(`Name: ${profile.fullName}`);
  if (isNonEmpty(profile.headline)) lines.push(`Headline: ${profile.headline}`);
  if (isNonEmpty(profile.location)) lines.push(`Location: ${profile.location}`);
  if (isNonEmpty(profile.seniorityLevel)) lines.push(`Seniority: ${profile.seniorityLevel}`);
  if (isNonEmpty(profile.primaryEmail)) lines.push(`Email: ${profile.primaryEmail}`);
  if (isNonEmpty(profile.primaryPhone)) lines.push(`Phone: ${profile.primaryPhone}`);
  if (isNonEmpty(profile.workPermitInfo)) lines.push(`Work permit: ${profile.workPermitInfo}`);
  if (profile.socialLinks?.length) lines.push(`Social links: ${profile.socialLinks.join(', ')}`);

  const listFields = [
    formatList('Goals', profile.goals),
    formatList('Aspirations', profile.aspirations),
    formatList('Personal values', profile.personalValues),
    formatList('Strengths', profile.strengths),
    formatList('Interests', profile.interests),
    formatList('Skills', profile.skills),
    formatList('Certifications', profile.certifications),
    formatList('Languages', profile.languages),
  ].filter(Boolean);

  lines.push(...(listFields as string[]));

  return lines.length ? lines.join('\n') : null;
}

function formatExperiences(experiences?: Experience[] | null): string | null {
  if (!experiences?.length) return null;

  return experiences
    .map((experience) => {
      const headerParts = [
        experience.title,
        isNonEmpty(experience.companyName) ? `at ${experience.companyName}` : null,
        isNonEmpty(experience.experienceType) ? `(${experience.experienceType})` : null,
      ].filter(Boolean);

      const dates = [experience.startDate, experience.endDate].filter(isNonEmpty).join(' - ');
      const header = dates ? `${headerParts.join(' ')} — ${dates}` : headerParts.join(' ');

      const details = [
        formatList('Responsibilities', experience.responsibilities),
        formatList('Tasks', experience.tasks),
        formatList('Achievements', experience.achievements),
        formatList('KPIs', experience.kpiSuggestions),
      ].filter(Boolean);

      return details.length ? `- ${header}\n  ${details.join('\n  ')}` : `- ${header}`;
    })
    .join('\n');
}

function formatStories(stories?: SpeechStory[] | null): string | null {
  if (!stories?.length) return null;

  return stories
    .map((story, index) => {
      const title = isNonEmpty(story.title) ? story.title : `Story ${index + 1}`;
      const details = [
        isNonEmpty(story.situation) ? `Situation: ${story.situation}` : null,
        isNonEmpty(story.task) ? `Task: ${story.task}` : null,
        isNonEmpty(story.action) ? `Action: ${story.action}` : null,
        isNonEmpty(story.result) ? `Result: ${story.result}` : null,
        formatList('Achievements', story.achievements),
      ].filter(Boolean);

      return details.length ? `- ${title}\n  ${details.join('\n  ')}` : `- ${title}`;
    })
    .join('\n');
}

function formatPersonalCanvas(canvas?: PersonalCanvas | null): string | null {
  if (!canvas) return null;

  const sections = [
    formatList('Customer segments', canvas.customerSegments),
    formatList('Value proposition', canvas.valueProposition),
    formatList('Channels', canvas.channels),
    formatList('Customer relationships', canvas.customerRelationships),
    formatList('Key activities', canvas.keyActivities),
    formatList('Key resources', canvas.keyResources),
    formatList('Key partners', canvas.keyPartners),
    formatList('Cost structure', canvas.costStructure),
    formatList('Revenue streams', canvas.revenueStreams),
  ].filter(Boolean);

  return sections.length ? sections.join('\n') : null;
}

function formatJobDescription(job?: JobDescription | null): string | null {
  if (!job) return null;

  const lines = [
    isNonEmpty(job.title) ? `Title: ${job.title}` : null,
    isNonEmpty(job.seniorityLevel) ? `Seniority: ${job.seniorityLevel}` : null,
    isNonEmpty(job.roleSummary) ? `Role summary: ${job.roleSummary}` : null,
    formatList('Responsibilities', job.responsibilities),
    formatList('Required skills', job.requiredSkills),
    formatList('Behaviours', job.behaviours),
    formatList('Success criteria', job.successCriteria),
    formatList('Explicit pains', job.explicitPains),
    formatList('ATS keywords', job.atsKeywords),
  ].filter(Boolean);

  return lines.length ? lines.join('\n') : null;
}

function formatMatchingSummary(summary?: MatchingSummaryContext | null): string | null {
  if (!summary) return null;

  const lines = [
    `Overall score: ${summary.overallScore}`,
    `Score breakdown: skill ${summary.scoreBreakdown.skillFit}, experience ${summary.scoreBreakdown.experienceFit}, interest ${summary.scoreBreakdown.interestFit}, edge ${summary.scoreBreakdown.edge}`,
    `Recommendation: ${summary.recommendation}`,
    formatList('Reasoning highlights', summary.reasoningHighlights),
    formatList('Strengths for this role', summary.strengthsForThisRole),
    formatList('Skill match notes', summary.skillMatch),
    formatList('Risky points', summary.riskyPoints),
    formatList('Impact opportunities', summary.impactOpportunities),
    formatList('Tailoring tips', summary.tailoringTips),
  ].filter(Boolean);

  return lines.join('\n');
}

function formatCompanyProfile(company?: CompanyProfile | null): string | null {
  if (!company) return null;

  const lines = [
    isNonEmpty(company.companyName) ? `Company: ${company.companyName}` : null,
    isNonEmpty(company.industry) ? `Industry: ${company.industry}` : null,
    isNonEmpty(company.sizeRange) ? `Size: ${company.sizeRange}` : null,
    isNonEmpty(company.website) ? `Website: ${company.website}` : null,
    isNonEmpty(company.description) ? `Summary: ${company.description}` : null,
    formatList('Products/services', company.productsServices),
    formatList('Target markets', company.targetMarkets),
    formatList('Customer segments', company.customerSegments),
    isNonEmpty(company.rawNotes) ? `Notes: ${company.rawNotes}` : null,
  ].filter(Boolean);

  return lines.length ? lines.join('\n') : null;
}

export function formatAiInputContext(input: PromptInput): string {
  const sections: string[] = [`LANGUAGE\n${input.language}`];

  const profile = formatProfile(input.profile);
  if (profile) sections.push(`PROFILE\n${profile}`);

  const experiences = formatExperiences(input.experiences);
  if (experiences) sections.push(`EXPERIENCES\n${experiences}`);

  const stories = formatStories(input.stories);
  if (stories) sections.push(`STORIES\n${stories}`);

  const canvas = formatPersonalCanvas(input.personalCanvas);
  if (canvas) sections.push(`PERSONAL CANVAS\n${canvas}`);

  const job = formatJobDescription(input.jobDescription);
  if (job) sections.push(`TARGET JOB DESCRIPTION\n${job}`);

  const summary = formatMatchingSummary(input.matchingSummary);
  if (summary) sections.push(`MATCHING SUMMARY\n${summary}`);

  const company = formatCompanyProfile(input.company);
  if (company) sections.push(`COMPANY SUMMARY\n${company}`);

  return sections.join('\n\n');
}
