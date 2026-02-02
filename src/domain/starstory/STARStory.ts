import type { Schema } from '@amplify/data/resource';

export type STARStory = Schema['STARStory']['type'];
export type STARStoryCreateInput = Schema['STARStory']['createType'];
export type STARStoryUpdateInput = Schema['STARStory']['updateType'];
export type STARStoryWithExperience = STARStory & {
  experienceName?: string;
  companyName?: string;
};
