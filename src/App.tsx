import { PromptComposer } from '@/components/PromptComposer'
import { ResultPanel } from '@/components/ResultPanel'
import { TitleBar } from '@/components/TitleBar'

function App() {
  return (
    <div className="w-screen h-screen min-w-0 min-h-0 grid grid-rows-[44px_minmax(0,1fr)_32px] max-[820px]:grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden text-ink-200 bg-surface-900">
      <TitleBar />

      <main className="grid grid-cols-[1fr_minmax(320px,460px)] max-[720px]:grid-cols-1 max-[720px]:overflow-auto overflow-hidden min-h-0" aria-label="Lazy Prompter workspace">
        <PromptComposer />
        <ResultPanel />
      </main>

      <footer className="flex items-center justify-between px-3.5 text-xs text-ink-400 bg-surface-850 border-t border-chrome-line font-mono max-[820px]:hidden" aria-label="Workspace status">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 h-full opacity-80">local workspace</span>
        </div>
        <div />
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 h-full opacity-80">no cloud request sent</span>
        </div>
      </footer>
    </div>
  )
}

export default App
