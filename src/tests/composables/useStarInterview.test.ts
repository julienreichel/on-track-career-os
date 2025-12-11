import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStarInterview } from '@/composables/useStarInterview';
import { STARStoryService } from '@/domain/starstory/STARStoryService';

vi.mock('@/domain/starstory/STARStoryService');

describe('useStarInterview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { currentStepIndex, chatHistory, generatedStory, generating, error } =
        useStarInterview();

      expect(currentStepIndex.value).toBe(0);
      expect(chatHistory.value).toEqual([]);
      expect(generatedStory.value).toBeNull();
      expect(generating.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should create 4 STAR steps', () => {
      const { steps } = useStarInterview();

      expect(steps.value).toHaveLength(4);
      expect(steps.value[0].key).toBe('situation');
      expect(steps.value[1].key).toBe('task');
      expect(steps.value[2].key).toBe('action');
      expect(steps.value[3].key).toBe('result');
    });

    it('should add welcome and first question to chat history on initialize', () => {
      const { initialize, chatHistory } = useStarInterview();

      initialize();

      expect(chatHistory.value).toHaveLength(2);
      expect(chatHistory.value[0].role).toBe('assistant');
      expect(chatHistory.value[0].content).toBe('interview.welcome');
      expect(chatHistory.value[1].content).toBe('interview.situation.question');
    });

    it('should add context message when sourceText provided', () => {
      const { initialize, chatHistory } = useStarInterview('Some context');

      initialize();

      expect(chatHistory.value).toHaveLength(3);
      expect(chatHistory.value[0].content).toBe('interview.contextProvided');
    });
  });

  describe('submitAnswer', () => {
    it('should reject empty answers', () => {
      const { submitAnswer, error } = useStarInterview();

      const result = submitAnswer('');

      expect(result).toBe(false);
      expect(error.value).toBe('interview.errors.emptyAnswer');
    });

    it('should accept valid answers and update state', () => {
      const { initialize, submitAnswer, interviewAnswers, chatHistory } = useStarInterview();

      initialize();
      const result = submitAnswer('My situation answer');

      expect(result).toBe(true);
      expect(interviewAnswers.value.situation).toBe('My situation answer');
      expect(chatHistory.value[chatHistory.value.length - 1]).toMatchObject({
        role: 'user',
        content: 'My situation answer',
      });
    });
  });

  describe('navigation', () => {
    it('should move to next step when answer provided', () => {
      const { initialize, submitAnswer, nextStep, currentStepIndex } = useStarInterview();

      initialize();
      submitAnswer('Answer 1');
      const result = nextStep();

      expect(result).toBe(true);
      expect(currentStepIndex.value).toBe(1);
    });

    it('should not move past last step', () => {
      const { initialize, currentStepIndex, isLastStep, nextStep } = useStarInterview();

      initialize();
      currentStepIndex.value = 3;

      const result = nextStep();

      expect(result).toBe(false);
      expect(isLastStep.value).toBe(true);
    });

    it('should move to previous step', () => {
      const { initialize, currentStepIndex, previousStep, nextStep, submitAnswer } =
        useStarInterview();

      initialize();
      submitAnswer('Answer');
      nextStep();
      expect(currentStepIndex.value).toBe(1);

      const result = previousStep();

      expect(result).toBe(true);
      expect(currentStepIndex.value).toBe(0);
    });

    it('should not move before first step', () => {
      const { initialize, previousStep, isFirstStep } = useStarInterview();

      initialize();
      const result = previousStep();

      expect(result).toBe(false);
      expect(isFirstStep.value).toBe(true);
    });
  });

  describe('generateStory', () => {
    it('should require all steps completed', async () => {
      const { generateStory, error } = useStarInterview();

      const result = await generateStory();

      expect(result).toBeNull();
      expect(error.value).toBe('interview.errors.incompleteInterview');
    });

    it('should generate story from completed answers', async () => {
      const mockStory = {
        situation: 'Generated situation',
        task: 'Generated task',
        action: 'Generated action',
        result: 'Generated result',
      };

      vi.mocked(STARStoryService.prototype.generateStar).mockResolvedValue([mockStory]);

      const { initialize, submitAnswer, nextStep, generateStory, generatedStory } =
        useStarInterview();

      initialize();
      submitAnswer('Situation');
      nextStep();
      submitAnswer('Task');
      nextStep();
      submitAnswer('Action');
      nextStep();
      submitAnswer('Result');

      const result = await generateStory();

      expect(result).toEqual(mockStory);
      expect(generatedStory.value).toEqual(mockStory);
    });

    it('should handle generation errors', async () => {
      vi.mocked(STARStoryService.prototype.generateStar).mockRejectedValue(new Error('AI Error'));

      const { initialize, submitAnswer, nextStep, generateStory, error } = useStarInterview();

      initialize();
      submitAnswer('S');
      nextStep();
      submitAnswer('T');
      nextStep();
      submitAnswer('A');
      nextStep();
      submitAnswer('R');

      const result = await generateStory();

      expect(result).toBeNull();
      expect(error.value).toBe('AI Error');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { initialize, submitAnswer, reset, currentStepIndex, chatHistory, error } =
        useStarInterview();

      initialize();
      submitAnswer('Answer');
      error.value = 'Some error';

      reset();

      expect(currentStepIndex.value).toBe(0);
      expect(chatHistory.value).toEqual([]);
      expect(error.value).toBeNull();
    });
  });
});
