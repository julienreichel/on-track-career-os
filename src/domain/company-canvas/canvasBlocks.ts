export const COMPANY_CANVAS_BLOCKS = [
  'customerSegments',
  'valuePropositions',
  'channels',
  'customerRelationships',
  'revenueStreams',
  'keyResources',
  'keyActivities',
  'keyPartners',
  'costStructure',
] as const;

export type CompanyCanvasBlockKey = (typeof COMPANY_CANVAS_BLOCKS)[number];
