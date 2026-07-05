import { DecisionService } from '../domain/DecisionService';
import { DecisionRepository } from '../domain/DecisionRepository';

describe('DecisionService', () => {
  let service: DecisionService;
  let mockRepo: jest.Mocked<DecisionRepository>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new DecisionService(mockRepo);
  });

  it('should call repository findAll', async () => {
    await service.getAll();
    expect(mockRepo.findAll).toHaveBeenCalled();
  });
});
