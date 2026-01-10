import { COMPANY_CANVAS_BLOCKS } from '@/domain/company-canvas/canvasBlocks';

export const COMPANY_CANVAS_UI_BLOCKS = COMPANY_CANVAS_BLOCKS.map((key) => ({
  key,
  labelKey: `companies.canvas.blocks.${key}.label`,
  hintKey: `companies.canvas.blocks.${key}.hint`,
}));

export type CompanyCanvasBlockConfig = (typeof COMPANY_CANVAS_UI_BLOCKS)[number];
