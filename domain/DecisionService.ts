import { DecisionRepository } from './DecisionRepository';
import { Decision, CreateDecisionInput, UpdateDecisionInput } from './Decision.types';

export class DecisionService {
  constructor(private repository: DecisionRepository) {}

  async getAll(): Promise<Decision[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<Decision | null> {
    return this.repository.findById(id);
  }

  async create(input: CreateDecisionInput): Promise<Decision> {
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateDecisionInput): Promise<Decision> {
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
