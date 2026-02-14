import { Category, SetAppState } from '@/types'
import { CATEGORY_LABELS } from '@/lib/prompts'

interface CategorySelectProps {
  category: Category
  setAppState: SetAppState
  disabled: boolean
}

export function CategorySelect({ category, setAppState, disabled }: CategorySelectProps) {
  const categories: Category[] = ['coding', 'analysis', 'creative']

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ghost-muted tracking-wide">Category</label>
      <div className="flex gap-2 p-1.5 glass-panel">
        {categories.map((cat) => {
          const isActive = category === cat
          return (
            <button
              key={cat}
              onClick={() => setAppState(prev => ({ ...prev, category: cat }))}
              disabled={disabled}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan-sm'
                  : 'text-ghost-muted hover:text-ghost hover:bg-glass-hover border border-transparent'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
