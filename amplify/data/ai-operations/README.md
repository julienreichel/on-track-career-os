# AI Operations

This directory contains AWS Lambda functions implementing the 17 AI operations defined in the **AI Interaction Contract** (`docs/AI_Interaction_Contract.md`).

## Architecture

- **Backend**: AWS Amplify Gen2 + Lambda functions
- **AI Provider**: AWS Bedrock (Anthropic Claude 3.5 Sonnet)
- **Pattern**: Each AI operation = one Lambda function
- **Contract**: Strict JSON I/O validation with fallback strategies

## Implemented Operations

### Identity & Experience (EPIC 1A, 2)

- ✅ `ai.parseCvText` - Extract structured sections from CV text
- ⏳ `ai.extractExperienceBlocks` - Transform raw experience text
- ⏳ `ai.generateStarStory` - Create STAR methodology stories
- ⏳ `ai.generateAchievementsAndKpis` - Generate achievements + KPIs

### User Model / Canvas (EPIC 1B)

- ⏳ `ai.generatePersonalCanvas` - Generate Personal Business Model Canvas

### Job & Company (EPIC 5A / 5B)

- ⏳ `ai.parseJobDescription` - Extract job requirements
- ⏳ `ai.generateJobRoleCard` - Refine job analysis
- ⏳ `ai.analyzeCompanyInfo` - Analyze company data
- ⏳ `ai.generateCompanyCanvas` - Generate Company Canvas

### Matching Engine (EPIC 5C)

- ⏳ `ai.generateMatchingSummary` - User × Job × Company fit

### Application Materials (EPIC 6)

- ⏳ `ai.generateTailoredCvBlocks` - Tailored CV sections
- ⏳ `ai.generateCoverLetter` - Generate cover letters
- ⏳ `ai.generateTailoredSpeech` - Elevator pitches
- ⏳ `ai.generateTailoredKpis` - Tailored KPI suggestions

### Interview Prep (EPIC 7 / 9)

- ⏳ `ai.generateInterviewQuestions` - Generate interview questions
- ⏳ `ai.simulateInterviewTurn` - Simulate interview conversation
- ⏳ `ai.evaluateInterviewAnswer` - Evaluate interview answers

## Implementation Pattern

Each Lambda function follows this structure:

```typescript
// 1. Type definitions (I/O schemas)
interface OperationInput { ... }
interface OperationOutput { ... }

// 2. Constants (system prompt, temperatures, etc.)
const SYSTEM_PROMPT = `...`;
const MAX_TOKENS = 4000;
const TEMPERATURE = 0.3;

// 3. Helper functions (validateOutput, extractJson, etc.)
function validateOutput(output: Partial<Output>): Output { ... }

// 4. Main handler
export const handler = async (event: Event): Promise<string> => {
  const { input } = event.arguments;
  
  try {
    // Invoke Bedrock
    const aiResponse = await invokeBedrock(...);
    const parsed = JSON.parse(extractJson(aiResponse));
    const validated = validateOutput(parsed);
    
    // Log for traceability (AIC section 7)
    console.log('AI Operation: operationName', { timestamp, input, output });
    
    return JSON.stringify(validated);
  } catch (error) {
    // Fallback strategy (AIC section 6)
    if (error instanceof SyntaxError) {
      return await retryWithSchema(input);
    }
    throw error;
  }
};
```

## Error Handling & Fallbacks

Following **AIC Section 6**, each operation implements:

1. **JSON validation**: Extract JSON from markdown code blocks
2. **Schema validation**: Validate required fields exist
3. **Field fallbacks**: Missing strings → `""`, missing arrays → `[]`
4. **Retry strategy**: If JSON invalid, retry with explicit schema
5. **Final error**: User-friendly message after all retries fail

## Logging & Traceability

Each operation logs (AIC Section 7):

- `timestamp` - ISO 8601
- `input` - Request data (truncated if large)
- `output` - Validated response
- `fallbacksUsed` - Array of fallback strategies applied
- `error` - Error details if operation failed

## Testing

Test files are located in `test/unit/data/ai-operations/`:

```bash
npm run test:unit -- ai-operations
```

## Adding a New AI Operation

1. **Create Lambda file**: `amplify/data/ai-operations/{operationName}.ts`
2. **Define function**: In `amplify/data/resource.ts`:
   ```typescript
   export const {operationName}Function = defineFunction({
     entry: './ai-operations/{operationName}.ts',
     environment: { MODEL_ID },
     timeoutSeconds: 60,
   });
   ```
3. **Add to schema**: In the `schema` definition:
   ```typescript
   {operationName}: a
     .query()
     .arguments({ input: a.string().required() })
     .returns(a.string())
     .authorization((allow) => [allow.authenticated()])
     .handler(a.handler.function({operationName}Function)),
   ```
4. **Grant permissions**: In `amplify/backend.ts`:
   ```typescript
   backend.{operationName}Function.resources.lambda.addToRolePolicy(
     new PolicyStatement({
       effect: Effect.ALLOW,
       actions: ['bedrock:InvokeModel'],
       resources: [`arn:aws:bedrock:*::foundation-model/${MODEL_ID}`],
     }),
   );
   ```
5. **Write tests**: Create `test/unit/data/ai-operations/{operationName}.spec.ts`

## Model Configuration

- **Model**: Anthropic Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`)
- **Region**: Defaults to deployment region (must support Bedrock)
- **Timeout**: 60 seconds per Lambda invocation
- **Temperature**: 0.1-0.3 (deterministic parsing) to 0.5-0.7 (creative generation)
- **Max Tokens**: 1000-4000 depending on operation complexity

## Frontend Usage

```typescript
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

// Call AI operation
const { data, errors } = await client.queries.parseCvText({
  cv_text: cvTextContent,
});

if (!errors) {
  const result = JSON.parse(data);
  console.log(result.sections);
}
```

## References

- [AI Interaction Contract](../../../docs/AI_Interaction_Contract.md)
- [Amplify Gen2 + Bedrock Guide](https://docs.amplify.aws/react/build-a-backend/data/custom-business-logic/connect-bedrock/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 3.5 Sonnet Model Card](https://docs.anthropic.com/claude/docs/models-overview)
