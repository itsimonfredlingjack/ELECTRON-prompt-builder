import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
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

const PROMPT_TEXTAREA_ID = 'prompt-goal'

export function PromptComposer() {
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
    setInputText,
    setContextText,
    setMustInclude,
    setMustAvoid,
    setOutputShape,
    setReferenceMaterial,
    setPromptIntent,
    setPromptTarget,
    setPromptStrategy,
    addExtraConstraint,
    removeExtraConstraint,
  } = useComposerActions()
  const { canGenerate, startGeneration, cancelGeneration } = useGenerationControls()
  const { isBusy, generationState, error, notice } = useGenerationState()
  const {
    selectedModelId,
    selectedModelReady,
    selectedModelInstalled,
    runtimeSnapshot,
  } = useRuntimeState()

  const [constraintDraft, setConstraintDraft] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    textAreaRef.current?.focus()
  }, [])

  const workbenchState = useDeferredValue({
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

  const missingDetails = useMemo(() => detectMissingDetails(workbenchState), [workbenchState])
  const assumptions = useMemo(() => buildAssumptionNotes(workbenchState), [workbenchState])
  const constraintChips = useMemo(() => buildConstraintChips(workbenchState), [workbenchState])

  const disabledReason = useMemo(() => {
    if (isBusy || canGenerate) return null
    if (!inputText.trim()) return 'Add your raw intent to enable building.'
    if (!runtimeSnapshot?.daemonReachable) return 'Start Ollama or refresh runtime status.'
    if (!selectedModelId) return 'Choose a model first.'
    if (!selectedModelInstalled) return 'Install the selected model in Ollama.'
    if (!selectedModelReady) return 'Wait for the selected model to be ready.'
    return 'Prompt building is temporarily unavailable.'
  }, [
    canGenerate,
    inputText,
    isBusy,
    runtimeSnapshot?.daemonReachable,
    selectedModelId,
    selectedModelInstalled,
    selectedModelReady,
  ])

  const handleConstraintSubmit = () => {
    if (!constraintDraft.trim()) return
    addExtraConstraint(constraintDraft)
    setConstraintDraft('')
  }

  const selectedStrategy = STRATEGY_OPTIONS.find((option) => option.value === promptStrategy)

  return (
    <section className="panel-stack brief-console">
      <header className="panel-header">
        <div>
          <p className="util-microtype">Input</p>
          <h1 className="panel-title">Prompt brief</h1>
        </div>
        <div className="status-chip">
          <span className={`status-light ${isBusy ? 'is-active' : canGenerate ? 'is-ready' : 'is-blocked'}`} />
          <span>{isBusy ? generationState : canGenerate ? 'Ready to build' : 'Blocked'}</span>
        </div>
      </header>

      <div className="panel-body">
        <section className="composer-primary">
          <div className="field-row">
            <div>
              <label htmlFor={PROMPT_TEXTAREA_ID} className="field-label">Raw intent</label>
              <p className="field-help">Write the rough ask exactly as it exists now.</p>
            </div>
            <span className="field-meter">{inputText.trim().length} chars</span>
          </div>
          <textarea
            id={PROMPT_TEXTAREA_ID}
            ref={textAreaRef}
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            disabled={isBusy}
            placeholder="Describe the job in plain language..."
            className="ui-textarea-main"
          />
        </section>

        <section className="material-dock compact-section">
          <div className="section-heading">
            <div>
              <p className="field-label">Prompt settings</p>
              <p className="field-help">
                {formatIntentLabel(promptIntent)} / {formatTargetLabel(promptTarget)} / {formatStrategyLabel(promptStrategy)}
              </p>
            </div>
          </div>

          <div className="planner-grid">
            <SegmentGroup
              density="tight"
              title="Intent"
              options={INTENT_OPTIONS}
              selectedValue={promptIntent}
              onSelect={setPromptIntent}
              disabled={isBusy}
            />
            <SegmentGroup
              density="standard"
              title="Target"
              options={TARGET_OPTIONS}
              selectedValue={promptTarget}
              onSelect={setPromptTarget}
              disabled={isBusy}
            />
          </div>

          <div className="strategy-stack">
            <p className="field-label">Strategy</p>
            <p className="field-help">{selectedStrategy?.description}</p>
            <div className="strategy-options">
              {STRATEGY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPromptStrategy(option.value)}
                  disabled={isBusy}
                  className={`strategy-option ${option.value === promptStrategy ? 'is-active' : ''}`}
                >
                  <span>{option.label === 'More structured' ? 'Structured' : option.label === 'System prompt' ? 'System' : option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="material-dock compact-section">
          <div className="section-heading">
            <div>
              <p className="field-label">Constraints</p>
              <p className="field-help">Pinned rules carried into the generated prompt.</p>
            </div>
          </div>

          <div className="constraint-entry">
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
              className="control-input"
            />
            <button
              type="button"
              onClick={handleConstraintSubmit}
              disabled={isBusy || !constraintDraft.trim()}
              className="ui-action"
            >
              Add
            </button>
          </div>

          <div className="constraint-chips">
            {constraintChips.length > 0 ? constraintChips.map((chip) => {
              const removable = extraConstraints.includes(chip)

              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => removable && removeExtraConstraint(chip)}
                  disabled={!removable || isBusy}
                  className={`constraint-chip ${removable ? 'is-removable' : ''}`}
                >
                  {chip}
                  {removable ? ' x' : ''}
                </button>
              )
            }) : (
              <p className="field-help">No extra constraints yet.</p>
            )}
          </div>
        </section>

        <section className="secondary-drawer">
          <div className="section-heading">
            <div>
              <p className="field-label">Context and diagnostics</p>
              <p className="field-help">Detailed steering fields, missing inputs, and assumptions.</p>
            </div>
            <button
              type="button"
              className="drawer-toggle"
              onClick={() => setShowDetails((current) => !current)}
            >
              {showDetails ? 'Hide' : 'Show'}
            </button>
          </div>

          {showDetails && (
            <div className="drawer-content">
              <div className="context-grid">
                <CompactField
                  id="advanced-context"
                  label="Context"
                  value={contextText}
                  onChange={setContextText}
                  disabled={isBusy}
                  placeholder="Audience, environment, constraints"
                />
                <CompactField
                  id="advanced-must-include"
                  label="Must include"
                  value={mustInclude}
                  onChange={setMustInclude}
                  disabled={isBusy}
                  placeholder="Non-negotiable facts or requirements"
                />
                <CompactField
                  id="advanced-must-avoid"
                  label="Must avoid"
                  value={mustAvoid}
                  onChange={setMustAvoid}
                  disabled={isBusy}
                  placeholder="What to avoid in the output"
                />
                <CompactField
                  id="advanced-output-shape"
                  label="Output shape"
                  value={outputShape}
                  onChange={setOutputShape}
                  disabled={isBusy}
                  placeholder="Format, sections, or structure"
                />
              </div>

              <CompactField
                id="advanced-reference-material"
                label="Reference material"
                value={referenceMaterial}
                onChange={setReferenceMaterial}
                disabled={isBusy}
                placeholder="Source text, notes, examples, or attached-image context"
                large
              />

              <section className="insight-grid">
                <InsightCluster
                  label="Missing"
                  emptyText="The brief already has enough structure for a solid first pass."
                  items={missingDetails.map((item) => ({
                    id: item.id,
                    title: item.label,
                    detail: item.detail,
                    tone: item.severity === 'warning' ? 'warning' : 'neutral',
                  }))}
                />
                <InsightCluster
                  label="Will add"
                  emptyText="No special assumptions for this pass."
                  items={assumptions.map((item) => ({
                    id: item.id,
                    title: item.label,
                    detail: item.detail,
                    tone: 'strong' as const,
                  }))}
                />
              </section>
            </div>
          )}
        </section>
      </div>

      <footer className="panel-footer">
        {(error || notice) && (
          <p className={`status-message ${error ? 'is-error' : ''}`}>{error ?? notice}</p>
        )}

        <button
          type="button"
          onClick={isBusy ? cancelGeneration : () => void startGeneration()}
          disabled={!isBusy && !canGenerate}
          className="ui-build"
        >
          {isBusy ? `Stop ${generationState}` : 'Build Prompt'}
        </button>

        <p className="ui-helper">
          {disabledReason ?? 'Cmd/Ctrl + Enter builds from the current brief. Esc cancels.'}
        </p>
      </footer>
    </section>
  )
}

interface CompactFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled: boolean
  large?: boolean
}

function CompactField({ id, label, value, onChange, placeholder, disabled, large = false }: CompactFieldProps) {
  return (
    <section className={large ? 'compact-field is-wide' : 'compact-field'}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={large ? 'ui-textarea-small is-large' : 'ui-textarea-small'}
      />
    </section>
  )
}

interface SegmentGroupProps<T extends string> {
  density: 'standard' | 'tight'
  title: string
  options: Array<{ value: T; label: string }>
  selectedValue: T
  onSelect: (value: T) => void
  disabled: boolean
}

function SegmentGroup<T extends string>({
  density,
  title,
  options,
  selectedValue,
  onSelect,
  disabled,
}: SegmentGroupProps<T>) {
  return (
    <section className={`segment-group is-${density}`}>
      <p className="field-label">{title}</p>
      <div className="segment-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            disabled={disabled}
            className={`segment-option ${option.value === selectedValue ? 'is-active' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  )
}

interface InsightClusterProps {
  label: string
  emptyText: string
  items: Array<{
    id: string
    title: string
    detail: string
    tone: 'warning' | 'neutral' | 'strong'
  }>
}

function InsightCluster({ label, emptyText, items }: InsightClusterProps) {
  return (
    <section className="insight-cluster">
      <p className="field-label">{label}</p>
      {items.length === 0 ? (
        <p className="field-help">{emptyText}</p>
      ) : (
        <div className="insight-list">
          {items.map((item) => (
            <div key={item.id} className={`insight-item is-${item.tone}`}>
              <p>{item.title}</p>
              <span>{item.detail}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
