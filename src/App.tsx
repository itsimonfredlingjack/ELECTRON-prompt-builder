import { motion } from 'framer-motion'
import { PromptComposer } from '@/components/PromptComposer'
import { ResultPanel } from '@/components/ResultPanel'
import { TitleBar } from '@/components/TitleBar'
import { panelSpring } from '@/lib/springs'

function App() {
  return (
    <div className="w-screen h-screen min-w-0 min-h-0 grid grid-rows-[44px_minmax(0,1fr)_28px] max-[820px]:grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden text-ink-200 bg-surface-900">
      <TitleBar />

      <motion.main
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={panelSpring}
        className="grid grid-cols-[minmax(0,1fr)_minmax(320px,460px)] max-[720px]:grid-cols-1 max-[720px]:overflow-auto overflow-hidden min-h-0 bg-surface-900"
        aria-label="Lazy Prompter workspace"
      >
        <PromptComposer />
        <ResultPanel />
      </motion.main>

      <footer
        className="flex items-center justify-between px-4 text-[10.5px] tracking-[0.06em] uppercase text-ink-400/80 bg-surface-850 border-t border-chrome-line font-mono max-[820px]:hidden"
        aria-label="Workspace status"
      >
        <span className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-accent-500/60" aria-hidden="true" />
          local workspace
        </span>
        <span>no cloud request sent</span>
      </footer>
    </div>
  )
}

export default App
