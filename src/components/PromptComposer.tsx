import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useComposerActions, useComposerState } from '@/contexts/composerContext'
import { useGenerationControls, useGenerationState } from '@/contexts/generationContext'
import { useRuntimeActions, useRuntimeState } from '@/contexts/runtimeContext'
import {
  INTENT_OPTIONS,
  STRATEGY_OPTIONS,
  TARGET_OPTIONS,
} from '@/lib/promptWorkbench'
import { X } from '@/lib/icons'
import { panelSpring, pressSpring, defaultSpring } from '@/lib/springs'

const PROMPT_TEXTAREA_ID = 'prompt-goal'
type AdvancedPane = 'constraints' | 'settings' | 'reference'

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
    uploadStatus,
    uploadProgress,
    uploadError,
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
    attachFile,
    clearAttachment,
  } = useComposerActions()
  const { canGenerate, startGeneration, cancelGeneration } = useGenerationControls()
  const { isBusy, generationState, error, notice } = useGenerationState()
  const { refreshRuntime } = useRuntimeActions()
  const {
    selectedModelId,
    selectedModelReady,
    selectedModelInstalled,
    runtimeSnapshot,
    runtimeRefreshing,
    selectedModelVisionSupport,
  } = useRuntimeState()

  const [constraintDraft, setConstraintDraft] = useState('')
  const [activeAdvancedPane, setActiveAdvancedPane] = useState<AdvancedPane | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    textAreaRef.current?.focus()
  }, [])

  const disabledReason = useMemo(() => {
    if (isBusy || canGenerate) return null
    if (!inputText.trim()) return 'Add your raw intent to enable building.'
    if (!runtimeSnapshot?.daemonReachable) return 'Start Ollama or retry connection.'
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
  const selectedModelLabel = selectedModelId ?? 'select model'
  const canAttachImage = selectedModelVisionSupport === 'supported' && !isBusy
  const isRuntimeBlocked = runtimeSnapshot?.daemonReachable === false
  const hasComposerContent = [
    inputText,
    contextText,
    mustInclude,
    mustAvoid,
    outputShape,
    referenceMaterial,
  ].some((value) => value.trim().length > 0) || extraConstraints.length > 0 || imageAttachment !== null

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void attachFile(file)
  }

  return (
    <section className="comp" aria-label="Prompt brief">
      <header className="comp-head">
        <span className="comp-title">Brief</span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            setInputText('')
            setContextText('')
            setMustInclude('')
            setMustAvoid('')
            setOutputShape('')
            setReferenceMaterial('')
            extraConstraints.forEach(removeExtraConstraint)
            clearAttachment()
          }}
          disabled={isBusy || !hasComposerContent}
        >
          Clear
        </button>
      </header>

      <div className="comp-body slim-scroll">
        <section>
          <div className="fld-label">
            <label htmlFor={PROMPT_TEXTAREA_ID}>Raw intent</label>
            <span className="fld-hint">{inputText.trim().length} chars</span>
          </div>
          <textarea
            id={PROMPT_TEXTAREA_ID}
            ref={textAreaRef}
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            disabled={isBusy}
            placeholder="Describe the rough ask. Messy is fine."
            className="comp-ta comp-ta--intent"
          />
        </section>

        <section>
          <div className="fld-label">
            <label htmlFor="brief-context">Context</label>
          </div>
          <textarea
            id="brief-context"
            value={contextText}
            onChange={(event) => setContextText(event.target.value)}
            disabled={isBusy}
            placeholder="Audience, environment, constraints"
            className="comp-ta comp-ta--context"
          />
        </section>

        <section className={`advanced-panel ${activeAdvancedPane ? 'is-open' : ''}`} aria-label="Advanced prompt controls">
          <div className="advanced-head">
            <button
              type="button"
              className="advanced-toggle"
              aria-expanded={activeAdvancedPane !== null}
              aria-controls="advanced-panel-body"
              onClick={() => setActiveAdvancedPane((current) => current ? null : 'constraints')}
            >
              <span>Advanced</span>
              <span className="advanced-summary">More controls</span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {activeAdvancedPane && (
              <motion.div
                key="advanced-shell"
                id="advanced-panel-body"
                className="advanced-shell"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={panelSpring}
                style={{ overflow: 'hidden' }}
              >
              <div className="advanced-tabs" role="tablist" aria-label="Advanced control groups">
                <AdvancedTab
                  id="advanced-tab-constraints"
                  active={activeAdvancedPane === 'constraints'}
                  onClick={() => setActiveAdvancedPane('constraints')}
                >
                  Constraints
                </AdvancedTab>
                <AdvancedTab
                  id="advanced-tab-settings"
                  active={activeAdvancedPane === 'settings'}
                  onClick={() => setActiveAdvancedPane('settings')}
                >
                  Settings
                </AdvancedTab>
                <AdvancedTab
                  id="advanced-tab-reference"
                  active={activeAdvancedPane === 'reference'}
                  onClick={() => setActiveAdvancedPane('reference')}
                >
                  Reference
                </AdvancedTab>
              </div>

              <div className="advanced-content" role="tabpanel" aria-labelledby={`advanced-tab-${activeAdvancedPane}`}>
                {activeAdvancedPane === 'constraints' && (
                  <>
                    <div className="advanced-grid advanced-grid--constraints">
                      <label className="mini-field" htmlFor="brief-must-include">
                        <span>Include</span>
                        <input
                          id="brief-must-include"
                          value={mustInclude}
                          onChange={(event) => setMustInclude(event.target.value)}
                          disabled={isBusy}
                          placeholder="required terms"
                          className="comp-input"
                        />
                      </label>
                      <label className="mini-field" htmlFor="brief-must-avoid">
                        <span>Avoid</span>
                        <input
                          id="brief-must-avoid"
                          value={mustAvoid}
                          onChange={(event) => setMustAvoid(event.target.value)}
                          disabled={isBusy}
                          placeholder="things to skip"
                          className="comp-input"
                        />
                      </label>
                      <label className="mini-field" htmlFor="brief-output-shape">
                        <span>Output</span>
                        <input
                          id="brief-output-shape"
                          value={outputShape}
                          onChange={(event) => setOutputShape(event.target.value)}
                          disabled={isBusy}
                          placeholder="format"
                          className="comp-input"
                        />
                      </label>
                    </div>

                    <div className="pin-entry">
                      <span className="mini-label">Pinned rule</span>
                      <div className="constraint-entry constraint-entry--compact">
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
                          placeholder="Add one rule"
                          className="comp-input"
                        />
                        <button
                          type="button"
                          onClick={handleConstraintSubmit}
                          disabled={isBusy || !constraintDraft.trim()}
                          className="btn btn--sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="constraint-chips constraint-chips--compact">
                      <AnimatePresence initial={false}>
                        {extraConstraints.length > 0 ? extraConstraints.map((chip) => (
                          <motion.button
                            key={chip}
                            type="button"
                            layout
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={defaultSpring}
                            onClick={() => removeExtraConstraint(chip)}
                            disabled={isBusy}
                            className="chip chip--accent"
                          >
                            {chip}<X className="x" size={11} strokeWidth={2.5} />
                          </motion.button>
                        )) : (
                          <p className="field-help">No pinned rules.</p>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {activeAdvancedPane === 'settings' && (
                  <>
                    <div className="advanced-grid advanced-grid--settings">
                      <CompactSelect
                        id="brief-intent"
                        label="Intent"
                        value={promptIntent}
                        options={INTENT_OPTIONS}
                        onChange={setPromptIntent}
                        disabled={isBusy}
                      />
                      <CompactSelect
                        id="brief-target"
                        label="Target"
                        value={promptTarget}
                        options={TARGET_OPTIONS}
                        onChange={setPromptTarget}
                        disabled={isBusy}
                      />
                      <CompactSelect
                        id="brief-strategy"
                        label="Strategy"
                        value={promptStrategy}
                        options={STRATEGY_OPTIONS}
                        onChange={setPromptStrategy}
                        disabled={isBusy}
                      />
                    </div>
                    <p className="field-help strategy-note">{selectedStrategy?.description}</p>
                  </>
                )}

                {activeAdvancedPane === 'reference' && (
                  <>
                    <div className="reference-strip">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                      {imageAttachment ? (
                        <div className="imgchip">
                          <img src={imageAttachment.previewUrl} alt="" className="thumb-img" />
                          <div className="imgchip-copy">
                            <span>{imageAttachment.name}</span>
                            <small>{uploadStatus} · {formatBytes(imageAttachment.size)}</small>
                          </div>
                          <button type="button" className="icn-btn" onClick={clearAttachment} disabled={isBusy} aria-label="Remove image attachment">
                            <X size={13} strokeWidth={2.25} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!canAttachImage}
                        >
                          Attach image
                        </button>
                      )}
                      <span className={`badge ${selectedModelVisionSupport === 'supported' ? 'badge--violet' : 'badge--warn'}`}>
                        {selectedModelVisionSupport === 'supported' ? 'vision ready' : 'vision unavailable'}
                      </span>
                    </div>
                    {(uploadError || uploadStatus === 'uploading' || uploadStatus === 'validating' || uploadStatus === 'analyzing') && (
                      <p className={`status-message ${uploadError ? 'is-error' : ''}`}>
                        {uploadError?.message ?? `Image ${uploadStatus} · ${uploadProgress}%`}
                      </p>
                    )}
                    <label className="compact-field compact-field--reference" htmlFor="advanced-reference-material">
                      <span className="mini-label">Reference material</span>
                      <textarea
                        id="advanced-reference-material"
                        value={referenceMaterial}
                        onChange={(event) => setReferenceMaterial(event.target.value)}
                        disabled={isBusy}
                        placeholder="Source text, notes, examples, or attached-image context"
                        className="ui-textarea-small is-compact"
                      />
                    </label>
                  </>
                )}
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <footer className="comp-foot">
        <div className="comp-foot-meta">
          <span className="dropdown" title={selectedModelLabel}>{selectedModelLabel}</span>
        </div>

        {(error || notice) && (
          <p className={`status-message ${error ? 'is-error' : ''}`}>{error ?? notice}</p>
        )}

        <div className="comp-foot-actions">
          {isRuntimeBlocked ? (
            <motion.button
              type="button"
              onClick={() => void refreshRuntime()}
              disabled={runtimeRefreshing}
              whileTap={{ scale: 0.97 }}
              transition={pressSpring}
              className="btn btn--primary"
              aria-label="Retry local runtime"
            >
              {runtimeRefreshing ? 'Retrying' : 'Retry connection'}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={isBusy ? cancelGeneration : () => void startGeneration()}
              disabled={!isBusy && !canGenerate}
              whileTap={{ scale: 0.97 }}
              transition={pressSpring}
              className="btn btn--primary"
              aria-label="Build Prompt"
            >
              {isBusy ? `Stop ${generationState}` : 'Sharpen'}
              {!isBusy && canGenerate && <span className="kbd kbd--dark">⌘↵</span>}
            </motion.button>
          )}
        </div>

        <p className={`ui-helper ${disabledReason ? 'is-visible' : ''}`}>
          {disabledReason ?? '⌘↵ sharpen · esc cancel'}
        </p>
      </footer>
    </section>
  )
}

interface AdvancedTabProps {
  id: string
  active: boolean
  children: string
  onClick: () => void
}

function AdvancedTab({ id, active, children, onClick }: AdvancedTabProps) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      className={active ? 'is-active' : ''}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface CompactSelectProps<T extends string> {
  id: string
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  disabled: boolean
}

function CompactSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
}: CompactSelectProps<T>) {
  return (
    <label className="mini-field" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        disabled={disabled}
        className="mini-select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
