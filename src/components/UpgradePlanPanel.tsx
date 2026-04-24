import { useDeferredValue, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useComposerActions, useComposerState } from '@/contexts/composerContext'
import { useGenerationControls, useGenerationState } from '@/contexts/generationContext'
import { useRuntimeState } from '@/contexts/runtimeContext'
import {
  INTENT_OPTIONS,
  STRATEGY_OPTIONS,
  TARGET_OPTIONS,
  buildAssumptionNotes,
  buildConstraintChips,
  detectMissingDetails,
  formatIntentLabel,
  formatStrategyLabel,
  formatTargetLabel,
} from '@/lib/promptWorkbench'

export function UpgradePlanPanel() {
  const {
    inputText,
    contextText,
    mustInclude,
    mustAvoid,
    outputShape,
    referenceMaterial,
    extraConstraints,
    imageAttachment,
    promptIntent,
    promptTarget,
    promptStrategy,
  } = useComposerState()
  const {
    setPromptIntent,
    setPromptTarget,
    setPromptStrategy,
    addExtraConstraint,
    removeExtraConstraint,
  } = useComposerActions()
  const { canGenerate, startGeneration, cancelGeneration } = useGenerationControls()
  const { generationState, isBusy, error, notice } = useGenerationState()
  const { selectedModelId, selectedModelReady } = useRuntimeState()
  const [constraintDraft, setConstraintDraft] = useState('')

  const deferredState = useDeferredValue({
    rawIntent: inputText,
    contextText,
    mustInclude,
    mustAvoid,
    outputShape,
    referenceMaterial,
    extraConstraints,
    promptIntent,
    promptTarget,
    promptStrategy,
    hasImageAttachment: !!imageAttachment,
  })

  const missingDetails = useMemo(() => detectMissingDetails(deferredState), [deferredState])
  const assumptions = useMemo(() => buildAssumptionNotes(deferredState), [deferredState])
  const constraintChips = useMemo(() => buildConstraintChips(deferredState), [deferredState])

  const disabledReason = !isBusy && !canGenerate
    ? !inputText.trim()
      ? 'Add a rough request before building the prompt.'
      : !selectedModelId
        ? 'Choose a model to enable prompt building.'
        : !selectedModelReady
          ? 'Wait for the selected model to become ready.'
          : 'Prompt building is temporarily unavailable.'
    : null

  const selectedIntent = INTENT_OPTIONS.find((option) => option.value === promptIntent)
  const selectedTarget = TARGET_OPTIONS.find((option) => option.value === promptTarget)
  const selectedStrategy = STRATEGY_OPTIONS.find((option) => option.value === promptStrategy)

  const handleConstraintSubmit = () => {
    if (!constraintDraft.trim()) return
    addExtraConstraint(constraintDraft)
    setConstraintDraft('')
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="studio-header">
        <p className="studio-title">Upgrade plan</p>
        <p className="studio-subtitle">
          This is where the app decides how the raw request gets sharper, stricter, and more executable.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-[var(--text-dim)]">
          <span className="field-help">{formatIntentLabel(promptIntent)}</span>
          <span>•</span>
          <span className="field-help">{formatTargetLabel(promptTarget)}</span>
          <span>•</span>
          <span className="field-help">{formatStrategyLabel(promptStrategy)}</span>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <ControlGroup title="Intent" description={selectedIntent?.description ?? ''}>
          <SegmentGrid
            options={INTENT_OPTIONS}
            selectedValue={promptIntent}
            onSelect={(value) => setPromptIntent(value)}
            disabled={isBusy}
            columns={2}
          />
        </ControlGroup>

        <ControlGroup title="Target" description={selectedTarget?.description ?? ''}>
          <SegmentGrid
            options={TARGET_OPTIONS}
            selectedValue={promptTarget}
            onSelect={(value) => setPromptTarget(value)}
            disabled={isBusy}
            columns={2}
          />
        </ControlGroup>

        <ControlGroup title="Strategy" description={selectedStrategy?.description ?? ''}>
          <div className="space-y-2">
            {STRATEGY_OPTIONS.map((option) => {
              const isSelected = option.value === promptStrategy
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPromptStrategy(option.value)}
                  disabled={isBusy}
                  className={`w-full rounded-[10px] border px-3 py-2.5 text-left transition ${
                    isSelected
                      ? 'action-chip-active border-[var(--accent)]'
                      : 'action-chip'
                  } disabled:cursor-not-allowed disabled:text-[var(--text-dim)]`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-[var(--text-strong)]">{option.label}</span>
                    {isSelected && (
                      <span className="text-[11px] font-medium text-[var(--accent-strong)]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--text-dim)]">{option.description}</p>
                </button>
              )
            })}
          </div>
        </ControlGroup>

        <ControlGroup
          title="Constraints"
          description="Brief fields already count. Add extra constraints only when they do not fit elsewhere."
        >
          <div className="flex gap-2">
            <input
              value={constraintDraft}
              onChange={(event) => setConstraintDraft(event.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleConstraintSubmit()
                }
              }}
              disabled={isBusy}
              placeholder="Add constraint"
              className="control-input h-11 flex-1"
            />
            <button
              type="button"
              onClick={handleConstraintSubmit}
              disabled={isBusy || !constraintDraft.trim()}
              className="button-ghost"
            >
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {constraintChips.length > 0 ? constraintChips.map((chip) => {
              const removable = extraConstraints.includes(chip)

              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => removable && removeExtraConstraint(chip)}
                  disabled={!removable || isBusy}
                  className={`rounded-[8px] border px-2.5 py-1 text-[11px] transition ${
                    removable
                      ? 'action-chip-active'
                      : 'button-ghost cursor-default text-[var(--text-dim)]'
                  }`}
                >
                  {chip}
                  {removable ? ' ×' : ''}
                </button>
              )
            }) : (
              <p className="text-[12px] text-[var(--text-dim)]">No extra constraints yet.</p>
            )}
          </div>
        </ControlGroup>

        <ControlGroup title="Upgrade notes" description="What is still missing, and what this pass will add on purpose.">
          <div className="space-y-3">
            <NoteCluster
              label="Missing"
              emptyText="The brief already has enough structure for a solid first pass."
              items={missingDetails.map((item) => ({
                id: item.id,
                title: item.label,
                detail: item.detail,
                tone: item.severity === 'warning' ? 'warning' : 'neutral',
              }))}
            />
            <NoteCluster
              label="Will add"
              emptyText="No special assumptions for this pass."
              items={assumptions.map((item) => ({
                id: item.id,
                title: item.label,
                detail: item.detail,
                tone: 'strong' as const,
              }))}
            />
          </div>
        </ControlGroup>
      </div>

      <footer className="border-t border-[var(--border-subtle)] px-4 py-3">
        {(notice || error) && (
          <div className={`mb-3 rounded-[10px] border px-3 py-2 text-[12px] leading-5 ${
            error ? 'border-[var(--danger)] bg-[rgba(255,128,128,0.12)] text-[var(--text-strong)]' : 'border-[var(--border-subtle)] bg-[var(--panel-bg)] text-[var(--text-body)]'
          }`}>
            {error ?? notice}
          </div>
        )}
        <button
          type="button"
          onClick={isBusy ? cancelGeneration : () => void startGeneration()}
          disabled={!isBusy && !canGenerate}
          className={isBusy ? 'button-ghost w-full' : 'button-primary w-full'}
        >
          {isBusy ? `Stop (${generationState})` : 'Build prompt'}
        </button>
        <p className="mt-2 text-[12px] leading-5 text-[var(--text-dim)]">
          {disabledReason ?? 'Cmd/Ctrl + Enter builds from the current plan. Esc cancels a running pass.'}
        </p>
      </footer>
    </section>
  )
}

interface ControlGroupProps {
  title: string
  description: string
  children: ReactNode
}

function ControlGroup({ title, description, children }: ControlGroupProps) {
  return (
    <section className="space-y-2">
      <div>
        <p className="field-label">{title}</p>
        <p className="field-help">{description}</p>
      </div>
      {children}
    </section>
  )
}

interface SegmentGridProps<T extends string> {
  options: Array<{ value: T; label: string }>
  selectedValue: T
  onSelect: (value: T) => void
  disabled: boolean
  columns: 2 | 3
}

function SegmentGrid<T extends string>({
  options,
  selectedValue,
  onSelect,
  disabled,
  columns,
}: SegmentGridProps<T>) {
  return (
    <div className={`grid gap-2 ${columns === 3 ? 'md:grid-cols-3' : 'grid-cols-2'} grid-cols-1`}>
      {options.map((option) => {
        const isSelected = option.value === selectedValue
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            disabled={disabled}
            className={`rounded-[10px] border px-3 py-2 text-left transition ${
              isSelected ? 'action-chip-active' : 'action-chip'
            } disabled:cursor-not-allowed disabled:text-[var(--text-dim)]`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

interface NoteClusterProps {
  label: string
  emptyText: string
  items: Array<{
    id: string
    title: string
    detail: string
    tone: 'warning' | 'neutral' | 'strong'
  }>
}

function NoteCluster({ label, emptyText, items }: NoteClusterProps) {
  return (
    <section className="field-card">
      <p className="field-label">{label}</p>
      {items.length === 0 ? (
        <p className="field-help">{emptyText}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {items.map((item) => {
            const borderColor = item.tone === 'warning'
              ? 'border-[var(--warning)]'
              : item.tone === 'strong'
                ? 'border-[var(--accent)]'
                : 'border-[var(--text-dim)]'

            return (
              <div key={item.id} className={`rounded-[10px] border ${borderColor} bg-[var(--panel-bg)] px-3 py-2`}>
                <p className="text-[12px] font-medium text-[var(--text-strong)]">{item.title}</p>
                <p className="mt-1 text-[12px] leading-5 text-[var(--text-dim)]">{item.detail}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
