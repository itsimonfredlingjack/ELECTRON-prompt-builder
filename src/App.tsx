import { PromptComposer } from '@/components/PromptComposer'
import { ResultPanel } from '@/components/ResultPanel'
import { TitleBar } from '@/components/TitleBar'

function App() {
  return (
    <div className="app-win">
      <TitleBar />

      <main className="ws" aria-label="Lazy Prompter workspace">
        <PromptComposer />
        <ResultPanel />
      </main>

      <footer className="sb" aria-label="Workspace status">
        <div className="sb-left">
          <span className="sb-item">local workspace</span>
        </div>
        <div />
        <div className="sb-right">
          <span className="sb-item">no cloud request sent</span>
        </div>
      </footer>
    </div>
  )
}

export default App
