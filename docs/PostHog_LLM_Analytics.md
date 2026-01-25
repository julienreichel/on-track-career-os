# PostHog LLM Analytics Implementation

## Overview

PostHog LLM analytics tracking is implemented in all AI Lambda functions to provide observability of Bedrock invocations, token usage, costs, and latency.

## Architecture

### Components

1. **posthog-node** - Official PostHog Node.js client
2. **bedrock.ts** - Central tracking point for all LLM invocations
3. **Environment Variables** - POSTHOG_API_KEY and POSTHOG_HOST passed to each Lambda

### Implementation Pattern

All AI operations flow through `invokeBedrock()` in [amplify/data/ai-operations/utils/bedrock.ts](amplify/data/ai-operations/utils/bedrock.ts), which:

1. Captures start time
2. Invokes Bedrock model (Nova or Claude)
3. Extracts token usage from response
4. Calculates duration and cost
5. Sends metrics to PostHog via `$ai_generation` event

## Tracked Metrics

Each LLM invocation sends the following properties to PostHog following the [official PostHog LLM Analytics documentation](https://posthog.com/docs/llm-analytics/installation/manual-capture?tab=Node.js):

### Required Properties

```typescript
{
  $ai_trace_id: string; // UUID to group AI events (generated per invocation)
  $ai_model: string; // e.g., "eu.amazon.nova-micro-v1:0"
  $ai_provider: string; // e.g., "amazon", "anthropic", "bedrock"
  $ai_input: Array<{
    // Messages sent to LLM
    role: 'system' | 'user';
    content: string;
  }>;
  $ai_input_tokens: number; // Prompt tokens
  $ai_output_choices: Array<{
    // Response choices from LLM
    role: 'assistant';
    content: string;
  }>;
  $ai_output_tokens: number; // Completion tokens
  $ai_latency: number; // Request duration in seconds
}
```

### Optional Custom Properties

```typescript
{
  $ai_temperature: number; // Temperature setting
  $ai_total_cost_usd: number; // Calculated cost
  operation: string; // e.g., "generateCv", "parseCvText"
}
```

## Cost Calculation

Pricing per 1M tokens (AWS Bedrock):

| Model      | Input Cost | Output Cost |
| ---------- | ---------- | ----------- |
| Nova Micro | $0.035     | $0.14       |
| Nova Lite  | $0.06      | $0.24       |
| Default    | $0.10      | $0.40       |

## Environment Configuration

### Lambda Functions

All 12 AI Lambda functions receive PostHog configuration:

```typescript
environment: {
  MODEL_ID,
  POSTHOG_API_KEY,
  POSTHOG_HOST,
}
```

### Lambda List

1. parseCvText
2. extractExperienceBlocks
3. generateStarStory
4. generateAchievementsAndKpis
5. generatePersonalCanvas
6. generateCv
7. parseJobDescription
8. analyzeCompanyInfo
9. generateCompanyCanvas
10. generateMatchingSummary
11. generateSpeech
12. generateCoverLetter

## Error Handling

PostHog tracking failures are logged but **do not** interrupt AI operations:

```typescript
try {
  posthog.capture({ ... });
} catch (error) {
  console.warn('PostHog tracking failed:', error);
}
```

## Usage Example

```typescript
// Automatic tracking when using invokeBedrock
const result = await invokeBedrock({
  systemPrompt: 'You are a CV expert',
  userPrompt: 'Parse this CV...',
  operationName: 'parseCvText', // Tracked in PostHog
});
```

## PostHog Dashboard

View LLM analytics in PostHog:

1. Event: `$ai_generation`
2. Filter by: `operation` property
3. Metrics: Token usage, cost, latency
4. Distinct ID: `backend-ai-operations`

## Benefits

- **Cost Monitoring**: Track per-operation costs
- **Performance**: Identify slow operations
- **Usage Patterns**: Understand which operations are most used
- **Token Optimization**: Identify high token operations for optimization
- **Error Tracking**: Monitor retry rates and failures

## Configuration Files

- [amplify/package.json](amplify/package.json) - posthog-node dependency
- [amplify/data/schema/lambdas.ts](amplify/data/schema/lambdas.ts) - Environment variable configuration
- [amplify/data/ai-operations/utils/bedrock.ts](amplify/data/ai-operations/utils/bedrock.ts) - Tracking implementation

## Notes

- PostHog tracking is disabled if `POSTHOG_API_KEY` is empty
- Uses PostHog EU instance: `https://eu.i.posthog.com`
- Singleton client instances for efficiency
- Supports both Nova and Claude model formats
