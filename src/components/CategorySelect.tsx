import { Category } from '@/types'
import { CATEGORY_LABELS } from '@/lib/prompts'
import { useApp } from '@/contexts/AppContext'

export function CategorySelect() {
  const { state, setState } = useApp()
  const categories: Category[] = ['coding', 'analysis', 'creative']

  return (
    <div className="flex flex-col gap-2">
      <label className="section-label">Category</label>
      <div className="flex gap-1 p-1 panel">
        {categories.map((cat) => {
          const isActive = state.category === cat
          return (
            <button
              key={cat}
              onClick={() => setState((prev) => ({ ...prev, category: cat }))}
              disabled={state.isGenerating}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'text-white bg-accent border border-accent'
                  : 'text-ghost-bright hover:text-ghost border border-transparent bg-void-light hover:bg-gray-100'
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
