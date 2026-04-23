export type PlayModeFilterValue = 'all' | 'league' | 'non_league'

export function PlayModeFilter({
  value,
  onChange,
}: {
  value: PlayModeFilterValue
  onChange: (next: PlayModeFilterValue) => void
}) {
  const options: { label: string; value: PlayModeFilterValue }[] = [
    { label: 'All', value: 'all' },
    { label: 'League', value: 'league' },
    { label: 'Non-League', value: 'non_league' },
  ]

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
            value === opt.value
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function filterByMode<T extends { play_mode: 'league' | 'non_league' }>(
  items: T[],
  mode: PlayModeFilterValue
): T[] {
  if (mode === 'all') return items
  return items.filter((r) => r.play_mode === mode)
}
