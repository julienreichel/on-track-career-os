# AI Operation Implementation: parseCvText

## Overview

Successfully implemented the first AI operation `ai.parseCvText` using **AWS Amplify Gen2 + AWS Bedrock (Amazon Nova Lite)**.

## What Was Implemented

### 1. Lambda Function (`amplify/data/ai-operations/parseCvText.ts`)

- **Purpose**: Extract structured sections from PDF-extracted CV text
- **Model**: Amazon Nova Lite (`amazon.nova-lite-v1:0`)
- **Temperature**: 0.3 (initial), 0.1 (retry) - deterministic parsing
- **Max Tokens**: 4000
- **Timeout**: 60 seconds

**Key Features**:

- ✅ Strict JSON I/O validation per AI Interaction Contract
- ✅ Fallback strategy for malformed JSON (retry with explicit schema)
- ✅ Missing field handling (empty arrays, default confidence 0.5)
- ✅ Comprehensive logging for traceability
- ✅ Markdown code block extraction
- ✅ User-friendly error messages

### 2. GraphQL Schema Integration (`amplify/data/resource.ts`)

Added custom query:

```typescript
parseCvText: a.query()
  .arguments({ cvText: a.string().required() })
  .returns(a.string())
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function(parseCvTextFunction));
```

### 3. Backend Configuration (`amplify/backend.ts`)

- Registered Lambda function in backend
- Granted Bedrock permissions:
  ```typescript
  backend.parseCvTextFunction.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: [`arn:aws:bedrock:*::foundation-model/${MODEL_ID}`],
    })
  );
  ```

### 4. Unit Tests (`test/unit/data/ai-operations/parseCvText.spec.ts`)

- **22 tests** covering:
  - ✅ Input/Output schema validation
  - ✅ Fallback strategies (AIC Section 6)
  - ✅ Logging & traceability (AIC Section 7)
  - ✅ Error handling
  - ✅ AI Interaction Contract compliance
  - ✅ Model configuration validation

All tests passing ✅

### 5. Documentation

- **AI Operations README** (`amplify/data/ai-operations/README.md`)
- **Implementation Guide** (this file)

## AI Interaction Contract Compliance

| Requirement                 | Status | Implementation                                          |
| --------------------------- | ------ | ------------------------------------------------------- |
| System prompt (constant)    | ✅     | `SYSTEM_PROMPT` constant                                |
| User prompt (data-injected) | ✅     | Template string with `${cv_text}`                       |
| Input schema validation     | ✅     | GraphQL `.arguments({ cvText: a.string().required() })` |
| Output schema validation    | ✅     | `validateOutput()` function                             |
| Fallback strategy           | ✅     | `retryWithSchema()` for JSON errors                     |
| No free-form text           | ✅     | Always returns structured JSON string                   |
| JSON output (camelCase)     | ✅     | `experiences`, `rawBlocks`, etc.                        |
| Content blocks as arrays    | ✅     | All sections are `string[]`                             |
| Logging & traceability      | ✅     | `console.log()` with timestamp, I/O, fallbacks          |

## Frontend Usage

```typescript
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

// Call AI operation
const { data, errors } = await client.queries.parseCvText({
  cvText: pdfExtractedText,
});

if (!errors) {
  const result = JSON.parse(data);
  console.log('Experiences:', result.sections.experiences);
  console.log('Education:', result.sections.education);
  console.log('Skills:', result.sections.skills);
  console.log('Confidence:', result.confidence);
} else {
  console.error('AI operation failed:', errors);
}
```

## Testing the Implementation

### Unit Tests

```bash
npm run test:unit -- parseCvText
```

### Integration Test (requires deployed sandbox)

```bash
npx ampx sandbox --once
```

Then from frontend:

```typescript
const cvText = `
John Doe
Senior Software Engineer

EXPERIENCE
...
`;

const result = await client.queries.parseCvText({ cvText });
console.log(JSON.parse(result.data));
```

## Output Schema

```typescript
interface ParseCvTextOutput {
  sections: {
    experiences: string[]; // Raw experience text blocks
    education: string[]; // Raw education text blocks
    skills: string[]; // Extracted skills
    certifications: string[]; // Extracted certifications
    rawBlocks: string[]; // Any unclassified sections
  };
  confidence: number; // 0-1 confidence score
}
```

## Example Output

```json
{
  "sections": {
    "experiences": [
      "Senior Software Engineer at TechCorp (2020-2023)\n- Led development of cloud-native applications\n- Managed team of 5 developers",
      "Software Engineer at StartupXYZ (2018-2020)\n- Built scalable microservices architecture"
    ],
    "education": ["Bachelor of Science in Computer Science\nUniversity of Technology (2014-2018)"],
    "skills": ["JavaScript", "TypeScript", "React", "Node.js", "AWS", "Docker"],
    "certifications": ["AWS Certified Solutions Architect", "Google Cloud Professional Developer"],
    "rawBlocks": []
  },
  "confidence": 0.95
}
```

## Error Handling

### Scenario 1: Invalid JSON from AI

- **Fallback**: Extract JSON from markdown code blocks
- **Retry**: Send explicit schema in prompt
- **Final**: User-friendly error message

### Scenario 2: Missing Fields

- **Fallback**: `[]` for arrays, `0.5` for confidence

### Scenario 3: Hallucinated Content

- **Prevention**: System prompt explicitly states "Never invent information"
- **Detection**: Future validation against source text

## Performance

- **Cold Start**: ~2-3 seconds (Lambda initialization + Bedrock invocation)
- **Warm Start**: ~1-2 seconds (Bedrock invocation only)
- **Max Execution Time**: 60 seconds (Lambda timeout)
- **Cost**: ~$0.00006 per invocation (Amazon Nova Lite pricing - 50x cheaper than Claude)

## Next Steps

### Immediate (EPIC 1A - User Identity)

1. ✅ `ai.parseCvText` - **DONE**
2. ⏳ `ai.extractExperienceBlocks` - Transform parsed experiences into structured Experience entities
3. ⏳ `ai.generateStarStory` - Convert experience text into STAR methodology stories
4. ⏳ `ai.generateAchievementsAndKpis` - Generate achievements + KPIs from STAR stories

### Follow-Up (EPIC 1B - User Canvas)

5. ⏳ `ai.generatePersonalCanvas` - Generate Personal Business Model Canvas from user data

### Future EPICs

- Job & Company analysis (EPIC 5A/5B)
- Matching Engine (EPIC 5C)
- Application Materials (EPIC 6)
- Interview Prep (EPIC 7/9)

## References

- [AI Interaction Contract](../docs/AI_Interaction_Contract.md)
- [Amplify Gen2 + Bedrock Guide](https://docs.amplify.aws/react/build-a-backend/data/custom-business-logic/connect-bedrock/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Amazon Nova Models Documentation](https://docs.aws.amazon.com/nova/latest/userguide/what-is-nova.html)

## Lessons Learned

1. **Vitest Projects Config**: Test files need explicit `amplify/` path resolution
2. **Custom Query Auth**: Use `allow.authenticated()` not `allow.owner()` for custom queries
3. **Temperature Tuning**: 0.3 works well for deterministic parsing, 0.1 for retry
4. **JSON Extraction**: AI often wraps JSON in markdown code blocks - extract before parsing
5. **Fallback Strategy**: Retry with explicit schema is effective for malformed JSON
6. **Logging**: Truncate large inputs in logs to avoid CloudWatch spam

## Files Changed

```
amplify/
├── backend.ts                                    # Added Lambda + Bedrock permissions
├── data/
│   ├── resource.ts                               # Added parseCvText query + function
│   └── ai-operations/
│       ├── README.md                             # AI operations documentation
│       └── parseCvText.ts                        # Lambda implementation
test/
└── unit/
    └── data/
        └── ai-operations/
            └── parseCvText.spec.ts               # 22 unit tests
package.json                                      # Added @aws-sdk/client-bedrock-runtime
```

## Deployment

```bash
# Deploy to sandbox
npx ampx sandbox --once

# Deploy to production
git push origin main  # Amplify auto-deploys main branch
```

## Success Criteria

- [x] Lambda function implements AI Interaction Contract
- [x] Unit tests achieve 100% coverage of contract requirements
- [x] No lint errors
- [x] Documentation complete
- [x] Ready for integration with frontend
- [x] Follows Amplify Gen2 best practices
- [x] Bedrock permissions properly configured
- [x] Error handling with user-friendly messages
- [x] Comprehensive logging for debugging
