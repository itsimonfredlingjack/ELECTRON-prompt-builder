import { Category } from '@/types'
import { CATEGORY_LABELS } from '@/lib/prompts'
import { useApp } from '@/contexts/AppContext'

export function CategorySelect() {
  const { state, setState } = useApp()
  const categories: Category[] = ['coding', 'analysis', 'creative']

  return (
    <div className="flex flex-col gap-2">
      <label className="section-label">Category</label>
      <div className="clay-tube w-full" />
      <div className="flex gap-1 p-1 panel rounded-md">
        {categories.map((cat) => {
          const isActive = state.category === cat
          return (
            <button
              key={cat}
              onClick={() => setState((prev) => ({ ...prev, category: cat }))}
              disabled={state.isGenerating}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? 'text-ghost-bright border border-accent/55 shadow-glow bg-accent/20'
                  : 'text-ghost hover:text-ghost-bright border border-transparent hover:border-void-border-bright bg-white/40 hover:bg-white/70 shadow-clay-sm'
              } ${state.isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
