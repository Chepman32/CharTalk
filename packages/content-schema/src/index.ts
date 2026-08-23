import { z } from 'zod'

export const scalarSchema = z.union([
  z.string(),
  z.number().int(),
  z.boolean(),
  z.null(),
])

export type Scalar = z.infer<typeof scalarSchema>

type ConditionInput =
  | { op: 'all' | 'any'; args: ConditionInput[] }
  | { op: 'not'; arg: ConditionInput }
  | { op: 'hasMemory'; key: string; value?: Scalar | undefined }
  | { op: 'chosen'; choiceId: string }
  | { op: 'seen'; nodeId: string }
  | { op: 'withinLastTurns'; choiceId: string; turns: number }
  | {
      op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
      path: string
      value: Scalar
    }
  | { op: 'exists'; path: string }
  | { op: 'always' | 'never' }

export const conditionSchema: z.ZodType<ConditionInput> = z.lazy(() =>
  z.discriminatedUnion('op', [
    z.object({ op: z.literal('all'), args: z.array(conditionSchema) }).strict(),
    z.object({ op: z.literal('any'), args: z.array(conditionSchema) }).strict(),
    z.object({ op: z.literal('not'), arg: conditionSchema }).strict(),
    z
      .object({
        op: z.literal('hasMemory'),
        key: z.string().min(1).max(200),
        value: scalarSchema.optional(),
      })
      .strict(),
    z
      .object({ op: z.literal('chosen'), choiceId: z.string().min(1).max(200) })
      .strict(),
    z
      .object({ op: z.literal('seen'), nodeId: z.string().min(1).max(200) })
      .strict(),
    z
      .object({
        op: z.literal('withinLastTurns'),
        choiceId: z.string().min(1).max(200),
        turns: z.number().int().min(1).max(1_000),
      })
      .strict(),
    z
      .object({
        op: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte']),
        path: z.string().min(1).max(200),
        value: scalarSchema,
      })
      .strict(),
    z
      .object({ op: z.literal('exists'), path: z.string().min(1).max(200) })
      .strict(),
    z.object({ op: z.literal('always') }).strict(),
    z.object({ op: z.literal('never') }).strict(),
  ]),
)

export type Condition = z.infer<typeof conditionSchema>

export const narrativeMessageSchema = z
  .object({
    messageId: z.string().min(1),
    speakerId: z.string().min(1),
    text: z.string().min(1).max(500),
    intentionalRepeatId: z.string().min(1).max(120).optional(),
    intentionalTypo: z.boolean().optional(),
    delayMs: z.number().int().min(0).max(3_000),
    kind: z.enum(['message', 'narrative', 'image']).default('message'),
    assetId: z.string().min(1).optional(),
    altText: z.string().min(1).optional(),
  })
  .strict()

export type NarrativeMessage = z.infer<typeof narrativeMessageSchema>

export const effectSchema = z.discriminatedUnion('op', [
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('increment'),
      path: z.string().min(1),
      by: z.number().int(),
      min: z.number().int(),
      max: z.number().int(),
    })
    .strict()
    .refine(value => value.min <= value.max, 'Effect bounds are reversed'),
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('set'),
      path: z.string().min(1),
      value: scalarSchema,
    })
    .strict(),
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('setMemory'),
      key: z.string().min(1),
      value: scalarSchema,
    })
    .strict(),
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('addMemory'),
      key: z.string().min(1),
      value: scalarSchema,
    })
    .strict(),
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('removeMemory'),
      key: z.string().min(1),
    })
    .strict(),
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('addPromise'),
      promiseId: z.string().min(1),
    })
    .strict(),
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('resolvePromise'),
      promiseId: z.string().min(1),
      outcome: z.enum(['kept', 'broken', 'released']),
    })
    .strict(),
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('advanceArc'),
      arcId: z.string().min(1),
      phase: z.string().min(1),
    })
    .strict(),
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('startCooldown'),
      cooldownId: z.string().min(1),
      turns: z.number().int().min(0).max(1_000),
    })
    .strict(),
  z
    .object({
      effectId: z.string().min(1),
      op: z.literal('addToSet'),
      path: z.string().min(1),
      value: z.string().min(1),
    })
    .strict(),
])

export type Effect = z.infer<typeof effectSchema>

export const choiceCandidateSchema = z
  .object({
    choiceId: z.string().min(1),
    text: z.string().min(1).max(110),
    intentionalRepeatId: z.string().min(1).max(120).optional(),
    intentionalTypo: z.boolean().optional(),
    intent: z.string().min(1),
    priority: z.number().int(),
    when: conditionSchema,
    effects: z.array(effectSchema),
    nextNodeId: z.string().min(1),
  })
  .strict()

export type ChoiceCandidate = z.infer<typeof choiceCandidateSchema>

export const choiceSlotSchema = z
  .object({
    slot: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    candidates: z.array(choiceCandidateSchema).min(1),
  })
  .strict()

export type ChoiceSlot = z.infer<typeof choiceSlotSchema>

export const editorialSchema = z
  .object({
    writerId: z.string().min(1),
    voiceEditorId: z.string().min(1),
    continuityEditorId: z.string().min(1),
    status: z.enum([
      'outline',
      'graph-ready',
      'draft',
      'voice-review',
      'continuity-review',
      'rating-review',
      'logic-qa',
      'device-qa',
      'qa',
      'approved',
      'scheduled',
      'published',
      'deprecated',
      'fixture',
    ]),
    voiceCardVersion: z.string().min(1),
    warningProfileId: z.string().nullable(),
  })
  .strict()

export const decisionNodeSchema = z
  .object({
    nodeId: z.string().min(1),
    type: z.literal('decision'),
    sceneId: z.string().min(1),
    onEnterEffects: z.array(effectSchema).default([]),
    messageVariants: z
      .array(
        z
          .object({
            variantId: z.string().min(1),
            priority: z.number().int(),
            when: conditionSchema,
            messages: z.array(narrativeMessageSchema).min(1).max(6),
          })
          .strict(),
      )
      .min(1),
    choiceSlots: z.array(choiceSlotSchema).length(4),
    checkpointPolicy: z.enum(['none', 'before', 'after']),
    editorial: editorialSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const slots = value.choiceSlots.map(slot => slot.slot)
    if (slots.join(',') !== '1,2,3,4') {
      context.addIssue({
        code: 'custom',
        path: ['choiceSlots'],
        message: 'Decision slots must be exactly [1, 2, 3, 4] in order',
      })
    }
  })

export type DecisionNode = z.infer<typeof decisionNodeSchema>

export const reactionNodeSchema = z
  .object({
    nodeId: z.string().min(1),
    type: z.literal('reaction'),
    sceneId: z.string().min(1),
    messages: z.array(narrativeMessageSchema).min(1).max(6),
    nextNodeId: z.string().min(1),
    effects: z.array(effectSchema).default([]),
    editorial: editorialSchema,
  })
  .strict()

export type ReactionNode = z.infer<typeof reactionNodeSchema>

export const bridgeNodeSchema = z
  .object({
    nodeId: z.string().min(1),
    type: z.literal('bridge'),
    sceneId: z.string().min(1),
    messages: z.array(narrativeMessageSchema).max(6),
    nextNodeId: z.string().min(1),
    effects: z.array(effectSchema).default([]),
    editorial: editorialSchema,
  })
  .strict()

export type BridgeNode = z.infer<typeof bridgeNodeSchema>

export const checkpointNodeSchema = z
  .object({
    nodeId: z.string().min(1),
    type: z.literal('checkpoint'),
    sceneId: z.string().min(1),
    checkpointId: z.string().min(1),
    label: z.string().min(1),
    recapFacts: z.array(z.string().min(1)).min(1).max(7),
    nextNodeId: z.string().min(1),
    editorial: editorialSchema,
  })
  .strict()

export type CheckpointNode = z.infer<typeof checkpointNodeSchema>

export const endingNodeSchema = z
  .object({
    nodeId: z.string().min(1),
    type: z.literal('ending'),
    sceneId: z.string().min(1),
    endingId: z.string().min(1),
    title: z.string().min(1),
    messages: z.array(narrativeMessageSchema),
    epilogueFacts: z.array(z.string().min(1)).default([]),
    editorial: editorialSchema,
  })
  .strict()

export type EndingNode = z.infer<typeof endingNodeSchema>

export const contentNodeSchema = z.discriminatedUnion('type', [
  decisionNodeSchema,
  reactionNodeSchema,
  bridgeNodeSchema,
  checkpointNodeSchema,
  endingNodeSchema,
])

export type ContentNode = z.infer<typeof contentNodeSchema>

export const characterSchema = z
  .object({
    characterId: z.string().min(1),
    name: z.string().min(1).max(80),
    ageLabel: z.string().min(1).max(80),
    isAdult: z.boolean(),
    hook: z.string().min(1).max(160),
    description: z.string().min(1).max(600),
    genres: z.array(z.string().min(1)).min(1).max(4),
    dynamics: z.array(z.string().min(1)).min(1).max(4),
    portraitAssetId: z.string().min(1),
    accent: z.enum(['ember', 'ochre', 'rose', 'plum', 'moss']),
  })
  .strict()

export type Character = z.infer<typeof characterSchema>

export const storySchema = z
  .object({
    storyId: z.string().min(1),
    characterId: z.string().min(1),
    title: z.string().min(1).max(120),
    premise: z.string().min(1).max(240),
    previewAssetId: z.string().min(1).optional(),
    status: z.enum(['complete', 'ongoing', 'mini']),
    rating: z.enum(['12+', '16+', '18+']),
    durationMinutes: z.number().int().positive().max(10_000),
    warningIds: z.array(z.string().min(1)),
    episodeIds: z.array(z.string().min(1)).min(1),
  })
  .strict()

export type Story = z.infer<typeof storySchema>

export const episodeSchema = z
  .object({
    episodeId: z.string().min(1),
    storyId: z.string().min(1),
    title: z.string().min(1).max(120),
    ordinal: z.number().int().positive(),
    entryNodeId: z.string().min(1),
    downloadBytes: z.number().int().nonnegative(),
    isBundled: z.boolean(),
    checkpointIds: z.array(z.string().min(1)),
  })
  .strict()

export type Episode = z.infer<typeof episodeSchema>

export const contentWarningSchema = z
  .object({
    warningId: z.string().min(1),
    category: z.enum([
      'profanity',
      'sexual-themes',
      'violence',
      'psychological-pressure',
      'addiction',
      'loss',
      'self-harm',
      'frightening',
      'abuse-or-stalking',
      'discrimination',
    ]),
    severity: z.enum(['mild', 'moderate', 'high']),
    summary: z.string().min(1).max(200),
    detail: z.string().min(1).max(500),
    sceneId: z.string().min(1),
    safeRoute: z
      .object({
        summary: z.string().min(1).max(500),
        effects: z.array(effectSchema),
        nextNodeId: z.string().min(1),
      })
      .strict(),
  })
  .strict()

export type ContentWarning = z.infer<typeof contentWarningSchema>

/**
 * Public discovery metadata deliberately omits narrative nodes and safe-route
 * effects. It is safe to cache and render before the signed package is
 * installed; the full ContentWarning is only available inside an installed
 * build.
 */
export const catalogWarningSchema = z
  .object({
    warningId: z.string().min(1),
    category: z.enum([
      'profanity',
      'sexual-themes',
      'violence',
      'psychological-pressure',
      'addiction',
      'loss',
      'self-harm',
      'frightening',
      'abuse-or-stalking',
      'discrimination',
    ]),
    severity: z.enum(['mild', 'moderate', 'high']),
    summary: z.string().min(1).max(200),
    detail: z.string().min(1).max(500),
    sceneId: z.string().min(1),
  })
  .strict()

export type CatalogWarning = z.infer<typeof catalogWarningSchema>

export const assetSchema = z
  .object({
    assetId: z.string().min(1),
    kind: z.enum(['portrait', 'attachment', 'cover', 'icon']),
    path: z.string().min(1),
    checksum: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    altText: z.string().min(1),
    provenance: z.enum([
      'original',
      'licensed',
      'generated-fixture',
      'unknown',
    ]),
  })
  .strict()

export type ContentAsset = z.infer<typeof assetSchema>

const semverSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Expected semantic version')
const engineMaxSchema = z
  .string()
  .regex(/^\d+(?:\.\d+\.\d+|\.x)$/, 'Expected version or major.x')

export const contentManifestSchema = z
  .object({
    packId: z.string().min(1),
    locale: z.literal('ru-RU'),
    schemaVersion: z.number().int().positive(),
    contentVersion: semverSchema,
    buildId: z.string().min(1),
    minEngineVersion: semverSchema,
    maxEngineVersion: engineMaxSchema,
    createdAt: z.string().datetime(),
    signingKeyId: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9][a-z0-9._:-]*$/i)
      .optional(),
    checksum: z.string().startsWith('sha256:'),
    signature: z.string().startsWith('ed25519:'),
  })
  .strict()
  .superRefine((manifest, context) => {
    const minMajor = Number(manifest.minEngineVersion.split('.')[0])
    const maxMajor = Number(manifest.maxEngineVersion.split('.')[0])
    if (minMajor > maxMajor) {
      context.addIssue({
        code: 'custom',
        path: ['maxEngineVersion'],
        message: 'Maximum engine version is lower than minimum engine version',
      })
    }
  })

export const contentPackageSchema = z
  .object({
    manifest: contentManifestSchema,
    characters: z.array(characterSchema).min(1),
    stories: z.array(storySchema).min(1),
    episodes: z.array(episodeSchema).min(1),
    nodes: z.array(contentNodeSchema).min(1),
    warnings: z.array(contentWarningSchema).default([]),
    assets: z.array(assetSchema).default([]),
  })
  .strict()

export type ContentPackage = z.infer<typeof contentPackageSchema>

/** Cacheable catalog response. No narrative nodes, choices, or assets cross
 * this boundary; those remain inside the signed exact-build package. */
export const catalogDataSchema = z
  .object({
    packId: z.string().min(1),
    locale: z.literal('ru-RU'),
    buildId: z.string().min(1),
    contentVersion: semverSchema,
    checksum: z.string().startsWith('sha256:'),
    characters: z.array(characterSchema),
    stories: z.array(storySchema),
    episodes: z.array(episodeSchema),
    warnings: z.array(catalogWarningSchema),
  })
  .strict()

export type CatalogData = z.infer<typeof catalogDataSchema>

export interface NarrativeState {
  relationships: Record<string, Record<string, number>>
  characterState: Record<string, Record<string, Scalar>>
  arcState: Record<string, Record<string, Scalar>>
  memories: Record<string, Scalar>
  promises: string[]
  /** Structured promise outcomes are additive for legacy saves that only stored IDs. */
  promiseStates?: Record<string, 'open' | 'kept' | 'broken' | 'released'>
  counters: Record<string, number>
  cooldowns: Record<string, number>
  seenNodes: Record<string, boolean>
  /** Ordered authored choice IDs used by history-aware conditions. */
  choiceHistory?: string[]
}

export function initialNarrativeState(): NarrativeState {
  return {
    relationships: {},
    characterState: {},
    arcState: {},
    memories: {},
    promises: [],
    promiseStates: {},
    counters: {},
    cooldowns: {},
    seenNodes: {},
    choiceHistory: [],
  }
}

export interface ChoiceEvent {
  eventId: string
  operationId: string
  runId: string
  sequence: number
  nodeId: string
  choiceId: string
  contentBuildId: string
  frozenEffects: Effect[]
  beforeStateHash: string
  afterStateHash: string
  committedAt: string
}
