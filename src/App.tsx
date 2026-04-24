import { PromptComposer } from '@/components/PromptComposer'
import { ResultPanel } from '@/components/ResultPanel'
import { TitleBar } from '@/components/TitleBar'

function App() {
  return (
    <div className="app-shell">
      <TitleBar />

      <main className="workspace-body flex-1">
        <section className="workspace-grid" aria-label="Prompt Builder workspace">
          <div className="material-slab prompt-panel prompt-panel-input">
            <PromptComposer />
          </div>

          <div className="material-slab prompt-panel prompt-panel-output">
            <ResultPanel />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
