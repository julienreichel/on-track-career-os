/**
 * Speech generation types
 * @see amplify/data/ai-operations/generateSpeech.ts
 */

import type {
  GenerateSpeechInput as LambdaSpeechInput,
  GenerateSpeechOutput as LambdaSpeechOutput,
} from '@amplify/data/ai-operations/generateSpeech';

export type SpeechInput = LambdaSpeechInput;
export type SpeechResult = LambdaSpeechOutput;

export function isSpeechResult(value: unknown): value is SpeechResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SpeechResult;
  return (
    typeof candidate.elevatorPitch === 'string' &&
    typeof candidate.careerStory === 'string' &&
    typeof candidate.whyMe === 'string'
  );
}
