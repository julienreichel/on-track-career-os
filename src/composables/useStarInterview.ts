import { ref, computed } from 'vue';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';

const PROGRESS_PERCENTAGE = 100;

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
 * Create interview steps configuration
 */
function createInterviewSteps(answers: {
  situation: string;
  task: string;
  action: string;
  result: string;
}): InterviewStep[] {
  return [
    {
      key: 'situation',
      question: 'interview.situation.question',
      completed: answers.situation.trim().length > 0,
      answer: answers.situation,
    },
    {
      key: 'task',
      question: 'interview.task.question',
      completed: answers.task.trim().length > 0,
      answer: answers.task,
    },
    {
      key: 'action',
      question: 'interview.action.question',
      completed: answers.action.trim().length > 0,
      answer: answers.action,
    },
    {
      key: 'result',
      question: 'interview.result.question',
      completed: answers.result.trim().length > 0,
      answer: answers.result,
    },
  ];
}

/**
 * Combine interview answers into AI-ready text
 */
function combineAnswersToText(
  answers: { situation: string; task: string; action: string; result: string },
  sourceText?: string
): string {
  return [
    sourceText,
    `Situation: ${answers.situation}`,
    `Task: ${answers.task}`,
    `Action: ${answers.action}`,
    `Result: ${answers.result}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Initialize chat history with welcome messages
 */
function initializeChatHistory(currentQuestion: string, sourceText?: string): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: 'assistant',
      content: 'interview.welcome',
      timestamp: new Date(),
    },
    {
      role: 'assistant',
      content: currentQuestion,
      timestamp: new Date(),
    },
  ];

  if (sourceText) {
    messages.unshift({
      role: 'assistant',
      content: 'interview.contextProvided',
      timestamp: new Date(),
    });
  }

  return messages;
}

/**
 * Add message to chat history
 */
function addChatMessage(history: ChatMessage[], role: 'assistant' | 'user', content: string): void {
  history.push({
    role,
    content,
    timestamp: new Date(),
  });
}

/**
 * Reset interview answers to empty state
 */
function createEmptyAnswers() {
  return {
    situation: '',
    task: '',
    action: '',
    result: '',
  };
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
  const interviewAnswers = ref(createEmptyAnswers());
  const generatedStory = ref<AiSTARStory | null>(null);
  const generating = ref(false);
  const error = ref<string | null>(null);

  const service = new STARStoryService();

  // Interview steps configuration
  const steps = computed<InterviewStep[]>(() => createInterviewSteps(interviewAnswers.value));

  // Computed
  const currentStep = computed(() => steps.value[currentStepIndex.value]);
  const isFirstStep = computed(() => currentStepIndex.value === 0);
  const isLastStep = computed(() => currentStepIndex.value === steps.value.length - 1);
  const canProceed = computed(() => currentStep.value?.completed ?? false);
  const allStepsCompleted = computed(() => steps.value.every((s) => s.completed));
  const progress = computed(
    () => (currentStepIndex.value / steps.value.length) * PROGRESS_PERCENTAGE
  );

  /**
   * Initialize interview with welcome message
   */
  const initialize = () => {
    chatHistory.value = initializeChatHistory(currentStep.value.question, sourceText);
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
    addChatMessage(chatHistory.value, 'user', answer);
    error.value = null;
    return true;
  };

  /**
   * Move to next step
   */
  const nextStep = () => {
    if (!canProceed.value || isLastStep.value) return false;
    currentStepIndex.value++;
    addChatMessage(chatHistory.value, 'assistant', currentStep.value.question);
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
      const combinedText = combineAnswersToText(interviewAnswers.value, sourceText);
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
    interviewAnswers.value = createEmptyAnswers();
    generatedStory.value = null;
    error.value = null;
    generating.value = false;
  };

  return {
    currentStepIndex,
    chatHistory,
    interviewAnswers,
    generatedStory,
    generating,
    error,
    currentStep,
    steps,
    isFirstStep,
    isLastStep,
    canProceed,
    allStepsCompleted,
    progress,
    initialize,
    submitAnswer,
    nextStep,
    previousStep,
    generateStory,
    reset,
  };
}
