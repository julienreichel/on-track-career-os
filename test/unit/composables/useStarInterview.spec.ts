import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStarInterview } from '@/composables/useStarInterview';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';

// Mock STARStoryService
vi.mock('@/domain/starstory/STARStoryService', () => ({
  STARStoryService: vi.fn(),
}));

describe('useStarInterview', () => {
  let mockService: {
    generateStar: ReturnType<typeof vi.fn>;
  };

  const mockGeneratedStories: AiSTARStory[] = [
    {
      situation: 'Led a complex migration',
      task: 'Migrate entire system',
      action: 'Planned and executed migration',
      result: 'Successful migration with zero downtime',
    },
  ];

  beforeEach(() => {
    mockService = {
      generateStar: vi.fn(),
    };
    vi.mocked(STARStoryService).mockImplementation(() => mockService as never);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const {
        currentStepIndex,
        chatHistory,
        generatedStory,
        generating,
        error,
        isFirstStep,
        isLastStep,
        canProceed,
        allStepsCompleted,
        progress,
      } = useStarInterview();

      expect(currentStepIndex.value).toBe(0);
      expect(chatHistory.value).toEqual([]);
      expect(generatedStory.value).toBeNull();
      expect(generating.value).toBe(false);
      expect(error.value).toBeNull();
      expect(isFirstStep.value).toBe(true);
      expect(isLastStep.value).toBe(false);
      expect(canProceed.value).toBe(false);
      expect(allStepsCompleted.value).toBe(false);
      expect(progress.value).toBe(0);
    });

    it('should initialize with source text', () => {
      const sourceText = 'I worked on a migration project...';
      const { initialize, chatHistory } = useStarInterview(sourceText);

      initialize();

      expect(chatHistory.value.length).toBeGreaterThan(0);
      expect(chatHistory.value.some((m) => m.content === 'interview.contextProvided')).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should set up chat history with welcome message', () => {
      const { initialize, chatHistory } = useStarInterview();

      initialize();

      expect(chatHistory.value.length).toBe(2);
      expect(chatHistory.value[0].role).toBe('assistant');
      expect(chatHistory.value[0].content).toBe('interview.welcome');
      expect(chatHistory.value[1].role).toBe('assistant');
      expect(chatHistory.value[1].content).toBe('interview.situation.question');
    });
  });

  describe('submitAnswer', () => {
    it('should submit answer and update state', () => {
      const { initialize, submitAnswer, interviewAnswers, chatHistory, canProceed } =
        useStarInterview();

      initialize();
      const initialHistoryLength = chatHistory.value.length;

      const result = submitAnswer('I was leading a migration project');

      expect(result).toBe(true);
      expect(interviewAnswers.value.situation).toBe('I was leading a migration project');
      expect(chatHistory.value.length).toBe(initialHistoryLength + 1);
      expect(chatHistory.value[chatHistory.value.length - 1].role).toBe('user');
      expect(canProceed.value).toBe(true);
    });

    it('should reject empty answers', () => {
      const { initialize, submitAnswer, error } = useStarInterview();
      initialize();

      const result = submitAnswer('');

      expect(result).toBe(false);
      expect(error.value).toBe('interview.errors.emptyAnswer');
    });

    it('should trim whitespace before validation', () => {
      const { initialize, submitAnswer } = useStarInterview();
      initialize();

      const result = submitAnswer('   ');

      expect(result).toBe(false);
    });
  });

  describe('step navigation', () => {
    it('should move to next step when answer is provided', () => {
      const {
        initialize,
        submitAnswer,
        nextStep,
        currentStepIndex,
        currentStep,
        isFirstStep,
        chatHistory,
      } = useStarInterview();

      initialize();
      submitAnswer('Situation answer');

      const result = nextStep();

      expect(result).toBe(true);
      expect(currentStepIndex.value).toBe(1);
      expect(currentStep.value.key).toBe('task');
      expect(isFirstStep.value).toBe(false);
      expect(chatHistory.value[chatHistory.value.length - 1].content).toBe('interview.task.question');
    });

    it('should not move to next step without answer', () => {
      const { initialize, nextStep, currentStepIndex } = useStarInterview();
      initialize();

      const result = nextStep();

      expect(result).toBe(false);
      expect(currentStepIndex.value).toBe(0);
    });

    it('should not move beyond last step', () => {
      const { initialize, submitAnswer, nextStep, currentStepIndex, isLastStep } =
        useStarInterview();

      initialize();
      submitAnswer('Situation');
      nextStep();
      submitAnswer('Task');
      nextStep();
      submitAnswer('Action');
      nextStep();
      submitAnswer('Result');

      expect(isLastStep.value).toBe(true);

      const result = nextStep();

      expect(result).toBe(false);
      expect(currentStepIndex.value).toBe(3);
    });

    it('should move to previous step', () => {
      const { initialize, submitAnswer, nextStep, previousStep, currentStepIndex } =
        useStarInterview();

      initialize();
      submitAnswer('Situation');
      nextStep();
      submitAnswer('Task');
      nextStep();

      const result = previousStep();

      expect(result).toBe(true);
      expect(currentStepIndex.value).toBe(1);
    });

    it('should not move before first step', () => {
      const { initialize, previousStep, currentStepIndex } = useStarInterview();
      initialize();

      const result = previousStep();

      expect(result).toBe(false);
      expect(currentStepIndex.value).toBe(0);
    });
  });

  describe('progress tracking', () => {
    it('should calculate progress percentage', () => {
      const { initialize, submitAnswer, nextStep, progress } = useStarInterview();
      initialize();

      expect(progress.value).toBe(0);

      submitAnswer('Situation');
      nextStep();
      expect(progress.value).toBe(25);

      submitAnswer('Task');
      nextStep();
      expect(progress.value).toBe(50);

      submitAnswer('Action');
      nextStep();
      expect(progress.value).toBe(75);
    });

    it('should mark steps as completed', () => {
      const { initialize, submitAnswer, nextStep, steps, allStepsCompleted } = useStarInterview();
      initialize();

      expect(allStepsCompleted.value).toBe(false);

      submitAnswer('Situation');
      expect(steps.value[0].completed).toBe(true);
      expect(allStepsCompleted.value).toBe(false);

      nextStep();
      submitAnswer('Task');
      nextStep();
      submitAnswer('Action');
      nextStep();
      submitAnswer('Result');

      expect(allStepsCompleted.value).toBe(true);
    });
  });

  describe('generateStory', () => {
    it('should generate story from complete answers', async () => {
      mockService.generateStar.mockResolvedValue(mockGeneratedStories);

      const { initialize, submitAnswer, nextStep, generateStory, generatedStory, generating, chatHistory } =
        useStarInterview();

      initialize();
      submitAnswer('Situation answer');
      nextStep();
      submitAnswer('Task answer');
      nextStep();
      submitAnswer('Action answer');
      nextStep();
      submitAnswer('Result answer');

      const result = await generateStory();

      expect(result).toEqual(mockGeneratedStories[0]);
      expect(generatedStory.value).toEqual(mockGeneratedStories[0]);
      expect(generating.value).toBe(false);
      expect(chatHistory.value[chatHistory.value.length - 1].content).toBe(
        'interview.storyGenerated'
      );
      expect(mockService.generateStar).toHaveBeenCalled();
    });

    it('should include source text in generation', async () => {
      mockService.generateStar.mockResolvedValue(mockGeneratedStories);
      const sourceText = 'Context: I worked on a migration project';

      const { initialize, submitAnswer, nextStep, generateStory } = useStarInterview(sourceText);

      initialize();
      submitAnswer('Situation');
      nextStep();
      submitAnswer('Task');
      nextStep();
      submitAnswer('Action');
      nextStep();
      submitAnswer('Result');

      await generateStory();

      const callArg = mockService.generateStar.mock.calls[0][0];
      expect(callArg).toContain(sourceText);
      expect(callArg).toContain('Situation: Situation');
    });

    it('should not generate story with incomplete answers', async () => {
      const { initialize, submitAnswer, generateStory, error } = useStarInterview();

      initialize();
      submitAnswer('Situation');
      submitAnswer('Task');
      // Missing action and result

      const result = await generateStory();

      expect(result).toBeNull();
      expect(error.value).toBe('interview.errors.incompleteInterview');
      expect(mockService.generateStar).not.toHaveBeenCalled();
    });

    it('should handle generation errors', async () => {
      const mockError = new Error('AI generation failed');
      mockService.generateStar.mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { initialize, submitAnswer, nextStep, generateStory, error, generating } = useStarInterview();

      initialize();
      submitAnswer('Situation');
      nextStep();
      submitAnswer('Task');
      nextStep();
      submitAnswer('Action');
      nextStep();
      submitAnswer('Result');

      const result = await generateStory();

      expect(result).toBeNull();
      expect(generating.value).toBe(false);
      expect(error.value).toBe('AI generation failed');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should randomly select from multiple generated stories', async () => {
      const multipleStories: AiSTARStory[] = [
        { situation: 'S1', task: 'T1', action: 'A1', result: 'R1' },
        { situation: 'S2', task: 'T2', action: 'A2', result: 'R2' },
        { situation: 'S3', task: 'T3', action: 'A3', result: 'R3' },
      ];
      mockService.generateStar.mockResolvedValue(multipleStories);

      const { initialize, submitAnswer, nextStep, generateStory, generatedStory } = useStarInterview();

      initialize();
      submitAnswer('Situation');
      nextStep();
      submitAnswer('Task');
      nextStep();
      submitAnswer('Action');
      nextStep();
      submitAnswer('Result');

      await generateStory();

      expect(generatedStory.value).toBeDefined();
      expect(generatedStory.value).not.toBeNull();
      expect(multipleStories).toContainEqual(generatedStory.value);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockService.generateStar.mockResolvedValue(mockGeneratedStories);

      const {
        initialize,
        submitAnswer,
        nextStep,
        generateStory,
        reset,
        currentStepIndex,
        chatHistory,
        interviewAnswers,
        generatedStory,
        error,
        generating,
      } = useStarInterview();

      initialize();
      submitAnswer('Situation');
      nextStep();
      submitAnswer('Task');
      nextStep();
      submitAnswer('Action');
      nextStep();
      submitAnswer('Result');
      await generateStory();

      expect(currentStepIndex.value).toBeGreaterThan(0);
      expect(chatHistory.value.length).toBeGreaterThan(0);
      expect(generatedStory.value).not.toBeNull();

      reset();

      expect(currentStepIndex.value).toBe(0);
      expect(chatHistory.value).toEqual([]);
      expect(interviewAnswers.value.situation).toBe('');
      expect(interviewAnswers.value.task).toBe('');
      expect(interviewAnswers.value.action).toBe('');
      expect(interviewAnswers.value.result).toBe('');
      expect(generatedStory.value).toBeNull();
      expect(error.value).toBeNull();
      expect(generating.value).toBe(false);
    });
  });

  describe('steps configuration', () => {
    it('should have 4 STAR steps', () => {
      const { steps } = useStarInterview();

      expect(steps.value).toHaveLength(4);
      expect(steps.value[0].key).toBe('situation');
      expect(steps.value[1].key).toBe('task');
      expect(steps.value[2].key).toBe('action');
      expect(steps.value[3].key).toBe('result');
    });

    it('should update steps when answers change', () => {
      const { submitAnswer, steps } = useStarInterview();

      expect(steps.value[0].answer).toBe('');
      expect(steps.value[0].completed).toBe(false);

      submitAnswer('My situation answer');

      expect(steps.value[0].answer).toBe('My situation answer');
      expect(steps.value[0].completed).toBe(true);
    });
  });
});
