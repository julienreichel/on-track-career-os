import { PersonalCanvasRepository } from './PersonalCanvasRepository';
import type { PersonalCanvas } from './PersonalCanvas';
// import { loadLazy } from '@/data/graphql/lazy'

export class PersonalCanvasService {
  constructor(private repo = new PersonalCanvasRepository()) {}

  async getFullPersonalCanvas(id: string): Promise<PersonalCanvas | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }
}
