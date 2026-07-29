type ProductCoverageProps = {
  summary: Record<string, number>
}

export function ProductCoverage({ summary }: ProductCoverageProps) {
  const entries = Object.entries(summary)
  const largestCategory = Math.max(1, ...entries.map(([, count]) => count))

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#172033]">Product coverage</h2>
        <span className="text-xs text-[#667085]">Mapped records</span>
      </div>
      {entries.length > 0 ? (
        <ul className="space-y-5">
          {entries.map(([category, count]) => (
            <li key={category}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="truncate font-medium text-[#344054]" title={category}>
                  {category}
                </span>
                <span className="font-semibold tabular-nums text-[#172033]">{count.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e8ebf1]">
                <div
                  className="h-full rounded-full bg-[#5d78ff]"
                  style={{ width: `${Math.max(6, (count / largestCategory) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-[#f4f5f7] p-4 text-sm leading-6 text-[#667085]">
          No mapped product categories were returned.
        </p>
      )}
    </div>
  )
}
