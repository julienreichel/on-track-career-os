# generateMatchingSummary Type Safety with a.ref()

## Summary

Implemented proper type safety for `generateMatchingSummary` AI operation using Amplify Gen2's **`a.ref()` pattern** for reusable custom types, providing full type safety from GraphQL schema through to Lambda execution.

## Approach

Following [Amplify's data modeling documentation](https://docs.amplify.aws/react/build-a-backend/data/data-modeling/add-fields/), we use `a.ref()` to reference named custom types:

```typescript
// Define types once
ProfileType: a.customType({ ... }),

// Reference with a.ref()
user: a.ref('ProfileType').required()
```

This enables:
- ✅ **DRY**: Define types once, reuse everywhere
- ✅ **Type Safety**: GraphQL validates structure automatically
- ✅ **Composability**: Build complex types from simpler ones
- ✅ **Modifiers**: `.required()` and `.array()` work on refs

## GraphQL Schema Structure

### Reusable Custom Types

```typescript
ProfileType: a.customType({
  fullName: a.string().required(),
  headline: a.string(),
  location: a.string(),
  seniorityLevel: a.string(),
  workPermitInfo: a.string(),
  goals: a.string().array(),
  aspirations: a.string().array(),
  personalValues: a.string().array(),
  strengths: a.string().array(),
  interests: a.string().array(),
  skills: a.string().array(),
  certifications: a.string().array(),
  languages: a.string().array(),
}),

PersonalCanvasType: a.customType({
  customerSegments: a.string().array(),
  valueProposition: a.string().array(),
  channels: a.string().array(),
  customerRelationships: a.string().array(),
  keyActivities: a.string().array(),
  keyResources: a.string().array(),
  keyPartners: a.string().array(),
  costStructure: a.string().array(),
  revenueStreams: a.string().array(),
}),

ExperienceType: a.customType({
  title: a.string().required(),
  companyName: a.string(),
  startDate: a.string(),
  endDate: a.string(),
  responsibilities: a.string().array(),
  tasks: a.string().array(),
  achievements: a.string().array(),
  kpiSuggestions: a.string().array(),
}),

// Composed type using a.ref()
UserType: a.customType({
  profile: a.ref('ProfileType').required(),
  personalCanvas: a.ref('PersonalCanvasType'),
  experienceSignals: a.customType({
    experiences: a.ref('ExperienceType').array().required(),
  }),
}),

JobType: a.customType({
  title: a.string().required(),
  seniorityLevel: a.string(),
  roleSummary: a.string(),
  responsibilities: a.string().array(),
  requiredSkills: a.string().array(),
  behaviours: a.string().array(),
  successCriteria: a.string().array(),
  explicitPains: a.string().array(),
}),

CompanyType: a.customType({
  companyName: a.string().required(),
  industry: a.string(),
  sizeRange: a.string(),
  website: a.string(),
  description: a.string(),
}),
```

### Query Definition

```typescript
generateMatchingSummary: a
  .query()
  .arguments({
    user: a.ref('UserType').required(),
    job: a.ref('JobType').required(),
    company: a.ref('CompanyType'),
  })
  .returns(
    a.customType({
      userFitScore: a.integer(),
      impactAreas: a.string().array().required(),
      contributionMap: a.string().array().required(),
      riskMitigationPoints: a.string().array().required(),
      summaryParagraph: a.string().required(),
      generatedAt: a.string().required(),
      needsUpdate: a.boolean().required(),
    })
  )
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function(generateMatchingSummaryFunction))
```

## Lambda Handler

The Lambda receives properly typed arguments directly from Amplify:

```typescript
type HandlerEvent = {
  arguments: {
    user: GenerateMatchingSummaryInput['user'];
    job: GenerateMatchingSummaryInput['job'];
    company?: {
      companyName: string;
      industry?: string;
      sizeRange?: string;
      website?: string;
      description?: string;
    };
  };
};

function parseInput(args: HandlerEvent['arguments']): GenerateMatchingSummaryInput {
  // Map company to expected internal structure (companyProfile + companyCanvas)
  const company = args.company ? {
    companyProfile: args.company,
    companyCanvas: undefined,
  } : undefined;

  return {
    user: args.user,
    job: args.job,
    company,
  };
}
```

**Key points:**
- Arguments arrive with correct types from GraphQL schema
- `parseInput()` adapts external schema to internal Lambda structure
- Company argument simplified at GraphQL level, expanded internally as needed

## Repository

Repository passes typed objects directly:

```typescript
async generateMatchingSummary(input: MatchingSummaryInput): Promise<MatchingSummaryResult> {
  const { data, errors } = await this.client.generateMatchingSummary(input, gqlOptions());

  if (errors && errors.length > 0) {
    throw new Error(`AI operation failed: ${JSON.stringify(errors)}`);
  }

  if (!data) {
    throw new Error('AI operation returned no data');
  }

  // With a.ref() types, data comes back properly typed
  return data as MatchingSummaryResult;
}
```

**Benefits:**
- No manual JSON stringification
- No parsing required
- Type-safe throughout

## Benefits

### ✅ Full Type Safety
- **GraphQL layer**: Schema enforces structure
- **Lambda layer**: TypeScript types match schema
- **Repository layer**: Type-safe interfaces
- **Composable layer**: Autocomplete and validation

### ✅ Matches Documentation
- Uses Amplify's recommended `a.ref()` pattern
- Types explicitly match AI_Interaction_Contract.md
- Clear, maintainable schema definitions

### ✅ DRY Principles
- Define types once (ProfileType, JobType, etc.)
- Reference everywhere with `a.ref()`
- Easy to update: change definition in one place

### ✅ Composability
- Build complex types from simple ones
- Nested refs work correctly (UserType uses ProfileType)
- Array and required modifiers work on refs

### ✅ Auto-Generated Types
- Amplify generates TypeScript types from schema
- Frontend gets type-safe GraphQL client
- Lambda handler gets typed event structures

## Schema Mapping

External schema (GraphQL) → Internal structure (Lambda):

### Input Mapping
```typescript
// GraphQL receives:
{
  user: UserType,
  job: JobType,
  company?: CompanyType
}

// Lambda internally uses:
{
  user: { profile, personalCanvas, experienceSignals },
  job: { ... },
  company?: { companyProfile, companyCanvas }
}
```

The `parseInput()` function bridges this gap, mapping the simpler GraphQL structure to the richer internal structure needed by the AI operation.

### Output Schema
```typescript
{
  userFitScore?: number,
  impactAreas: string[],
  contributionMap: string[],
  riskMitigationPoints: string[],
  summaryParagraph: string,
  generatedAt: string,
  needsUpdate: boolean
}
```

## Testing

All tests pass with typed approach:
- ✅ 119 Amplify Lambda tests
- ✅ 1115 Total tests
- Lambda tests use properly typed mock arguments
- Repository tests expect typed responses

## Future: Apply to Other AI Operations

This pattern should be applied to remaining AI operations:
- `parseCvText`
- `extractExperienceBlocks`
- `generateStarStory`
- `generatePersonalCanvas`
- `parseJobDescription`
- `analyzeCompanyInfo`
- `generateCompanyCanvas`
- `generateCv`

Each operation can define custom types and use `a.ref()` for type-safe, reusable schemas.

## References

- [Amplify Data Modeling: Add Fields](https://docs.amplify.aws/react/build-a-backend/data/data-modeling/add-fields/)
- AI Interaction Contract: `docs/AI_Interaction_Contract.md`
- Schema definition: `amplify/data/resource.ts`
- Lambda implementation: `amplify/data/ai-operations/generateMatchingSummary.ts`
