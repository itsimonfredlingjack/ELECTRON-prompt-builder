import type {
  Category,
  PromptInsight,
  PromptIntent,
  PromptMissingDetail,
  PromptStrategy,
  PromptTarget,
  PromptVersionKind,
} from '@/types'

export interface PromptWorkbenchState {
  rawIntent: string
  contextText: string
  mustInclude: string
  mustAvoid: string
  outputShape: string
  referenceMaterial: string
  extraConstraints: string[]
  promptIntent: PromptIntent
  promptTarget: PromptTarget
  promptStrategy: PromptStrategy
  hasImageAttachment?: boolean
}

export interface PromptBuildOptions {
  mode?: PromptVersionKind
  label?: string | null
  sourcePrompt?: string | null
  extraInstruction?: string | null
}

export interface PromptPlanNote {
  id: string
  label: string
  detail: string
}

export interface RefinementActionPreset {
  id: string
  label: string
  description: string
  lane: 'tighten' | 'format' | 'retarget' | 'elevate'
  instruction: string
  strategyOverride?: PromptStrategy
  targetOverride?: PromptTarget
  intentOverride?: PromptIntent
}

export const INTENT_OPTIONS: Array<{ value: PromptIntent; label: string; description: string }> = [
  { value: 'create', label: 'Create', description: 'Build something new from a rough ask.' },
  { value: 'analyze', label: 'Analyze', description: 'Sharpen prompts for review, synthesis, or breakdowns.' },
  { value: 'fix', label: 'Fix', description: 'Tighten prompts for debugging, repair, or correction work.' },
  { value: 'critique', label: 'Critique', description: 'Aim the prompt at evaluation and actionable feedback.' },
  { value: 'other', label: 'Other', description: 'Keep the framing general while preserving the job.' },
]

export const TARGET_OPTIONS: Array<{ value: PromptTarget; label: string; description: string }> = [
  { value: 'code', label: 'Code', description: 'Implementation, debugging, refactors, tests.' },
  { value: 'analysis', label: 'Analysis', description: 'Synthesis, comparison, research, critique.' },
  { value: 'creative', label: 'Creative', description: 'Writing, ideation, voice, or concept work.' },
  { value: 'general', label: 'General', description: 'Broad prompt building without domain lock-in.' },
]

export const STRATEGY_OPTIONS: Array<{ value: PromptStrategy; label: string; description: string }> = [
  { value: 'balanced', label: 'Balanced', description: 'Add useful structure without overbuilding the prompt.' },
  { value: 'stricter', label: 'Stricter', description: 'Push for tighter constraints and clearer success conditions.' },
  { value: 'structured', label: 'More structured', description: 'Impose a clearer prompt layout and output format.' },
  { value: 'system', label: 'System prompt', description: 'Recast the result as a directive operating prompt.' },
  { value: 'agentic', label: 'Agentic', description: 'Optimize for autonomous execution and completion criteria.' },
]

export const REFINEMENT_ACTIONS: RefinementActionPreset[] = [
  {
    id: 'make-stricter',
    label: 'Make stricter',
    description: 'Reduce ambiguity and force clearer success criteria.',
    lane: 'tighten',
    instruction: 'Tighten the prompt with stricter boundaries, explicit success criteria, and fewer assumptions.',
    strategyOverride: 'stricter',
  },
  {
    id: 'make-shorter',
    label: 'Make shorter',
    description: 'Compress the prompt without dropping critical constraints.',
    lane: 'tighten',
    instruction: 'Shorten the prompt while preserving the core task, constraints, and output guidance.',
  },
  {
    id: 'add-output-format',
    label: 'Add output format',
    description: 'Specify the exact deliverable shape the next model should return.',
    lane: 'format',
    instruction: 'Add a clearer output format with explicit sections, ordering, and deliverable shape.',
    strategyOverride: 'structured',
  },
  {
    id: 'system-prompt',
    label: 'Turn into system prompt',
    description: 'Convert the prompt into a stronger operating instruction.',
    lane: 'format',
    instruction: 'Recast the prompt as a direct system prompt with role, boundaries, and stable operating rules.',
    strategyOverride: 'system',
  },
  {
    id: 'make-agentic',
    label: 'Make more agentic',
    description: 'Add steps, checks, and completion criteria for autonomous work.',
    lane: 'elevate',
    instruction: 'Make the prompt better suited for an autonomous agent with steps, completion criteria, and self-checks.',
    strategyOverride: 'agentic',
  },
  {
    id: 'target-code',
    label: 'Target coding task',
    description: 'Push the prompt toward implementation detail and validation.',
    lane: 'retarget',
    instruction: 'Retarget the prompt for a coding task with implementation details, validation steps, and testing expectations.',
    targetOverride: 'code',
    intentOverride: 'fix',
  },
  {
    id: 'target-design-critique',
    label: 'Target design critique',
    description: 'Refocus the prompt on critique criteria and actionable feedback.',
    lane: 'retarget',
    instruction: 'Retarget the prompt for design critique with evaluation criteria, tradeoffs, and actionable recommendations.',
    targetOverride: 'analysis',
    intentOverride: 'critique',
  },
]

const DIRECT_REFERENCE_PATTERN = /\b(this|that|attached|below|above|screenshot|image|file|notes?)\b/i

export function mapTargetToCategory(target: PromptTarget): Category {
  switch (target) {
    case 'code':
      return 'coding'
    case 'analysis':
      return 'analysis'
    case 'creative':
      return 'creative'
    case 'general':
    default:
      return 'general'
  }
}

export function mapCategoryToTarget(category: Category): PromptTarget {
  switch (category) {
    case 'coding':
      return 'code'
    case 'analysis':
      return 'analysis'
    case 'creative':
      return 'creative'
    case 'general':
    default:
      return 'general'
  }
}

export function buildPromptBuilderInput(
  state: PromptWorkbenchState,
  options: PromptBuildOptions = {},
): string {
  const sections: string[] = []
  const mode = options.mode ?? 'initial'
  const label = options.label?.trim()
  const sourcePrompt = options.sourcePrompt?.trim()

  if (mode === 'refinement' && sourcePrompt) {
    sections.push('Refine the existing prompt below into a stronger version that is ready to send directly to another model.')
    sections.push(`Refinement goal: ${label ?? 'Tighten the prompt without changing the core job.'}`)
    sections.push(`Current prompt:\n${sourcePrompt}`)
  } else if (mode === 'variant' && sourcePrompt) {
    sections.push('Generate a distinct alternative prompt from the same brief. Keep the task intact, but change the framing enough to offer a credible second take.')
    sections.push(`Previous prompt:\n${sourcePrompt}`)
  }

  sections.push(`Raw intent:\n${state.rawIntent.trim() || '[PLACEHOLDER]'}`)
  sections.push([
    'Upgrade plan:',
    `- intent type: ${formatIntentLabel(state.promptIntent)}`,
    `- target use: ${formatTargetLabel(state.promptTarget)}`,
    `- rewrite strategy: ${formatStrategyLabel(state.promptStrategy)}`,
  ].join('\n'))

  const briefFields = [
    buildFieldBlock('Context', state.contextText),
    buildFieldBlock('Must include', state.mustInclude),
    buildFieldBlock('Must avoid', state.mustAvoid),
    buildFieldBlock('Output shape', state.outputShape),
    buildFieldBlock('Reference material', state.referenceMaterial),
  ].filter(Boolean)

  if (briefFields.length > 0 || state.hasImageAttachment) {
    sections.push([
      'Structured brief:',
      ...briefFields,
      state.hasImageAttachment ? '- Reference image is attached and should inform the rewritten prompt when relevant.' : '',
    ].filter(Boolean).join('\n'))
  }

  if (state.extraConstraints.length > 0) {
    sections.push([
      'Extra constraints:',
      ...state.extraConstraints.map((constraint) => `- ${constraint}`),
    ].join('\n'))
  }

  sections.push(`Strategy guidance:\n${getStrategyGuidance(state.promptStrategy)}`)

  if (options.extraInstruction?.trim()) {
    sections.push(`Additional instruction:\n${options.extraInstruction.trim()}`)
  }

  sections.push('If critical information is missing, keep the prompt actionable and use [PLACEHOLDER] for the missing facts.')
  return sections.join('\n\n')
}

export function detectMissingDetails(state: PromptWorkbenchState): PromptMissingDetail[] {
  const items: PromptMissingDetail[] = []

  if (state.rawIntent.trim().length < 28) {
    items.push({
      id: 'success-criteria',
      label: 'Success criteria',
      detail: 'The raw intent is short. Add what a good outcome should look like.',
      severity: 'warning',
    })
  }

  if (!state.outputShape.trim()) {
    items.push({
      id: 'output-shape',
      label: 'Output shape',
      detail: 'The app can sharpen the result further if it knows the format you want back.',
      severity: 'info',
    })
  }

  if (!state.mustInclude.trim()) {
    items.push({
      id: 'must-include',
      label: 'Must-have details',
      detail: 'List the constraints or facts that cannot be dropped during the rewrite.',
      severity: 'info',
    })
  }

  if (state.promptTarget === 'code' && !state.contextText.trim()) {
    items.push({
      id: 'code-context',
      label: 'Execution context',
      detail: 'Add stack, environment, or failure details so code prompts become more operational.',
      severity: 'warning',
    })
  }

  if (state.promptTarget === 'analysis' && !state.referenceMaterial.trim() && !state.hasImageAttachment) {
    items.push({
      id: 'source-material',
      label: 'Source material',
      detail: 'Analysis prompts improve when the input text, notes, or data source is referenced explicitly.',
      severity: 'warning',
    })
  }

  if (
    DIRECT_REFERENCE_PATTERN.test(state.rawIntent) &&
    !state.referenceMaterial.trim() &&
    !state.contextText.trim() &&
    !state.hasImageAttachment
  ) {
    items.push({
      id: 'referenced-material',
      label: 'Referenced material',
      detail: 'The brief mentions outside material, but no file, notes, or context have been attached.',
      severity: 'warning',
    })
  }

  return items.slice(0, 4)
}

export function buildAssumptionNotes(state: PromptWorkbenchState): PromptPlanNote[] {
  const notes: PromptPlanNote[] = [
    {
      id: 'placeholder',
      label: 'Missing facts become placeholders',
      detail: 'Unspecified details are surfaced as [PLACEHOLDER] instead of buried in vague prose.',
    },
  ]

  if (state.promptStrategy === 'system') {
    notes.push({
      id: 'system-shape',
      label: 'System-prompt framing',
      detail: 'The result will lean into role, rules, and operating boundaries instead of plain user messaging.',
    })
  } else if (state.promptStrategy === 'agentic') {
    notes.push({
      id: 'agentic-shape',
      label: 'Agent-style execution',
      detail: 'The result will add steps, completion checks, and stronger task sequencing.',
    })
  } else if (state.promptStrategy === 'structured') {
    notes.push({
      id: 'structure-shape',
      label: 'Structured output',
      detail: 'The rewrite will likely add clearer sections, headings, or output-format language.',
    })
  } else if (state.promptStrategy === 'stricter') {
    notes.push({
      id: 'strict-shape',
      label: 'Constraint-heavy rewrite',
      detail: 'The rewrite will trade friendliness for tighter scope and clearer boundaries.',
    })
  }

  if (state.promptTarget === 'code') {
    notes.push({
      id: 'code-expectations',
      label: 'Implementation detail bias',
      detail: 'The prompt will favor concrete execution details, validation, and testing expectations.',
    })
  }

  if (state.promptIntent === 'critique') {
    notes.push({
      id: 'critique-lens',
      label: 'Evaluation lens',
      detail: 'The prompt will ask for judgment, tradeoffs, and reasons, not just output generation.',
    })
  }

  return notes.slice(0, 3)
}

export function buildConstraintChips(state: PromptWorkbenchState): string[] {
  const chips: string[] = []

  if (state.mustInclude.trim()) chips.push('Must include')
  if (state.mustAvoid.trim()) chips.push('Must avoid')
  if (state.outputShape.trim()) chips.push('Output shape')
  if (state.referenceMaterial.trim() || state.hasImageAttachment) chips.push('Reference material')
  if (state.contextText.trim()) chips.push('Context')

  return [...chips, ...state.extraConstraints]
}

export function buildWhatImproved(
  state: PromptWorkbenchState,
  promptText: string,
  mode: PromptVersionKind = 'initial',
  label: string | null = null,
): PromptInsight[] {
  const items: PromptInsight[] = []
  const missingDetails = detectMissingDetails(state)
  const assumptionNotes = buildAssumptionNotes(state)

  items.push({
    id: 'clarified-goal',
    label: 'Clarified goal',
    detail: 'The raw ask is rewritten into a direct instruction another model can act on immediately.',
    tone: 'strong',
  })

  if (
    state.mustInclude.trim() ||
    state.mustAvoid.trim() ||
    state.extraConstraints.length > 0 ||
    state.promptStrategy === 'stricter'
  ) {
    items.push({
      id: 'added-constraints',
      label: 'Added constraints',
      detail: 'The rewrite now carries explicit requirements, guardrails, or tighter success criteria instead of relying on implied boundaries.',
      tone: 'neutral',
    })
  }

  if (
    state.outputShape.trim() ||
    hasStructuredPrompt(promptText) ||
    state.promptStrategy === 'structured' ||
    state.promptStrategy === 'system' ||
    state.promptStrategy === 'agentic'
  ) {
    items.push({
      id: 'imposed-structure',
      label: 'Imposed structure',
      detail: 'The prompt now has a clearer shape, sections, or output-format guidance instead of open-ended wording.',
      tone: 'neutral',
    })
  }

  if (promptText.includes('[PLACEHOLDER]') || missingDetails.length > 0) {
    items.push({
      id: 'inserted-placeholders',
      label: 'Inserted placeholders',
      detail: 'Missing facts were surfaced as [PLACEHOLDER] so the prompt stays operational without pretending to know more than it does.',
      tone: 'caution',
    })
  }

  if (assumptionNotes.length > 0 || mode !== 'initial') {
    items.push({
      id: 'assumptions-made',
      label: 'Assumptions made',
      detail: mode === 'refinement'
        ? `${label ?? 'This pass'} reworked the existing prompt using the selected strategy and target lens.`
        : assumptionNotes[0]?.detail ?? 'The selected target and strategy shaped how the rewrite framed the request.',
      tone: mode === 'refinement' ? 'strong' : 'neutral',
    })
  }

  return items.slice(0, 5)
}

export function createVersionTitle(
  kind: PromptVersionKind,
  index: number,
  label: string | null,
): string {
  if (label?.trim()) return label.trim()
  if (kind === 'variant') return `Alternative take ${index}`
  if (kind === 'refinement') return `Refinement ${index}`
  return `Prompt pass ${index}`
}

export function formatIntentLabel(intent: PromptIntent): string {
  return INTENT_OPTIONS.find((option) => option.value === intent)?.label ?? 'Create'
}

export function formatTargetLabel(target: PromptTarget): string {
  return TARGET_OPTIONS.find((option) => option.value === target)?.label ?? 'General'
}

export function formatStrategyLabel(strategy: PromptStrategy): string {
  return STRATEGY_OPTIONS.find((option) => option.value === strategy)?.label ?? 'Balanced'
}

export function formatVersionTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildFieldBlock(label: string, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return `- ${label}: ${trimmed}`
}

function getStrategyGuidance(strategy: PromptStrategy): string {
  switch (strategy) {
    case 'stricter':
      return 'Favor clear boundaries, stronger wording, explicit success criteria, and fewer implied assumptions.'
    case 'structured':
      return 'Use a more explicit prompt structure with sections, ordering, and clearer output instructions.'
    case 'system':
      return 'Write the result as a durable operating instruction with role, rules, and behavioral guardrails.'
    case 'agentic':
      return 'Optimize for autonomous execution with steps, checks, completion criteria, and crisp deliverables.'
    case 'balanced':
    default:
      return 'Improve the prompt without overengineering it. Add structure only where it makes the next model more effective.'
  }
}

function hasStructuredPrompt(promptText: string): boolean {
  return /(^|\n)([A-Z][A-Za-z ]+:|\d+\.\s|- )/.test(promptText)
}
