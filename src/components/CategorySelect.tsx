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
      <label className="text-sm font-medium text-gray-700">Category</label>
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setAppState(prev => ({ ...prev, category: cat }))}
            disabled={disabled}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
              category === cat
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
    </div>
  )
}
