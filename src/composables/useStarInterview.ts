import { ref, computed } from 'vue';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';

/**
 * STAR Interview Step State
 */
export interface InterviewStep {
  key: 'situation' | 'task' | 'action' | 'result';
  question: string;
  completed: boolean;
  answer: string;
}

/**
 * Interview Chat Message
 */
export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

/**
 * useStarInterview Composable
 *
 * Manages guided STAR interview flow:
 * - Step-by-step question progression
 * - Chat history for conversational UX
 * - AI story generation from interview answers
 * - Draft story state management
 *
 * @param sourceText - Optional initial context (experience text)
 */
export function useStarInterview(sourceText?: string) {
  // State
  const currentStepIndex = ref(0);
  const chatHistory = ref<ChatMessage[]>([]);
  const interviewAnswers = ref({
    situation: '',
    task: '',
    action: '',
    result: '',
  });
  const generatedStory = ref<AiSTARStory | null>(null);
  const generating = ref(false);
  const error = ref<string | null>(null);

  const service = new STARStoryService();

  // Interview steps configuration
  const steps = computed<InterviewStep[]>(() => [
    {
      key: 'situation',
      question: 'interview.situation.question',
      completed: interviewAnswers.value.situation.trim().length > 0,
      answer: interviewAnswers.value.situation,
    },
    {
      key: 'task',
      question: 'interview.task.question',
      completed: interviewAnswers.value.task.trim().length > 0,
      answer: interviewAnswers.value.task,
    },
    {
      key: 'action',
      question: 'interview.action.question',
      completed: interviewAnswers.value.action.trim().length > 0,
      answer: interviewAnswers.value.action,
    },
    {
      key: 'result',
      question: 'interview.result.question',
      completed: interviewAnswers.value.result.trim().length > 0,
      answer: interviewAnswers.value.result,
    },
  ]);

  // Computed
  const currentStep = computed(() => steps.value[currentStepIndex.value]);
  const isFirstStep = computed(() => currentStepIndex.value === 0);
  const isLastStep = computed(() => currentStepIndex.value === steps.value.length - 1);
  const canProceed = computed(() => currentStep.value?.completed || false);
  const allStepsCompleted = computed(() => steps.value.every((s) => s.completed));
  const progress = computed(() => (currentStepIndex.value / steps.value.length) * 100);

  /**
   * Initialize interview with welcome message
   */
  const initialize = () => {
    chatHistory.value = [
      {
        role: 'assistant',
        content: 'interview.welcome',
        timestamp: new Date(),
      },
      {
        role: 'assistant',
        content: currentStep.value.question,
        timestamp: new Date(),
      },
    ];

    if (sourceText) {
      chatHistory.value.unshift({
        role: 'assistant',
        content: 'interview.contextProvided',
        timestamp: new Date(),
      });
    }
  };

  /**
   * Submit answer for current step
   */
  const submitAnswer = (answer: string) => {
    if (!answer.trim()) {
      error.value = 'interview.errors.emptyAnswer';
      return false;
    }

    const stepKey = currentStep.value.key;
    interviewAnswers.value[stepKey] = answer;

    // Add user message to chat
    chatHistory.value.push({
      role: 'user',
      content: answer,
      timestamp: new Date(),
    });

    error.value = null;
    return true;
  };

  /**
   * Move to next step
   */
  const nextStep = () => {
    if (!canProceed.value || isLastStep.value) return false;

    currentStepIndex.value++;

    // Add next question to chat
    chatHistory.value.push({
      role: 'assistant',
      content: currentStep.value.question,
      timestamp: new Date(),
    });

    return true;
  };

  /**
   * Move to previous step
   */
  const previousStep = () => {
    if (isFirstStep.value) return false;
    currentStepIndex.value--;
    return true;
  };

  /**
   * Generate AI story from interview answers
   */
  const generateStory = async () => {
    if (!allStepsCompleted.value) {
      error.value = 'interview.errors.incompleteInterview';
      return null;
    }

    generating.value = true;
    error.value = null;

    try {
      // Combine answers into source text for AI
      const combinedText = [
        sourceText,
        `Situation: ${interviewAnswers.value.situation}`,
        `Task: ${interviewAnswers.value.task}`,
        `Action: ${interviewAnswers.value.action}`,
        `Result: ${interviewAnswers.value.result}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const aiStories = await service.generateStar(combinedText);

      // Pick random story (AI may generate multiple options)
      const randomIndex = Math.floor(Math.random() * aiStories.length);
      generatedStory.value = aiStories[randomIndex];

      chatHistory.value.push({
        role: 'assistant',
        content: 'interview.storyGenerated',
        timestamp: new Date(),
      });

      return generatedStory.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'interview.errors.generationFailed';
      console.error('[useStarInterview] Generation error:', err);
      return null;
    } finally {
      generating.value = false;
    }
  };

  /**
   * Reset interview state
   */
  const reset = () => {
    currentStepIndex.value = 0;
    chatHistory.value = [];
    interviewAnswers.value = {
      situation: '',
      task: '',
      action: '',
      result: '',
    };
    generatedStory.value = null;
    error.value = null;
    generating.value = false;
  };

  return {
    // State
    currentStepIndex,
    chatHistory,
    interviewAnswers,
    generatedStory,
    generating,
    error,

    // Computed
    currentStep,
    steps,
    isFirstStep,
    isLastStep,
    canProceed,
    allStepsCompleted,
    progress,

    // Actions
    initialize,
    submitAnswer,
    nextStep,
    previousStep,
    generateStory,
    reset,
  };
}
