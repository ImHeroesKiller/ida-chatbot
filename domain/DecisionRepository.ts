import { Decision, CreateDecisionInput, UpdateDecisionInput } from './Decision.types';

export interface DecisionRepository {
  findAll(): Promise<Decision[]>;
  findById(id: string): Promise<Decision | null>;
  create(input: CreateDecisionInput): Promise<Decision>;
  update(id: string, input: UpdateDecisionInput): Promise<Decision>;
  delete(id: string): Promise<void>;
}
