import type { Schema } from '@amplify/data/resource';

export type KanbanSettings = Schema['KanbanSettings']['type'];
export type KanbanSettingsCreateInput = Schema['KanbanSettings']['createType'];
export type KanbanSettingsUpdateInput = Schema['KanbanSettings']['updateType'];
export type KanbanStage = NonNullable<NonNullable<KanbanSettings['stages']>[number]>;
