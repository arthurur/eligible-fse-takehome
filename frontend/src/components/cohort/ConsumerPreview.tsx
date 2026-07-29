type ConsumerPreviewProps = {
  consumerIds: string[]
  totalCount: number
}

export function ConsumerPreview({ consumerIds, totalCount }: ConsumerPreviewProps) {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#172033]">Consumer preview</h2>
        <span className="text-xs text-[#667085]">
          First {consumerIds.length} of {totalCount.toLocaleString()}
        </span>
      </div>
      <ol className="grid overflow-hidden rounded-xl border border-[#dde1e8] sm:grid-cols-2">
        {consumerIds.map((consumerId, index) => (
          <li
            key={`${consumerId}-${index}`}
            className="flex min-w-0 items-center gap-3 border-b border-[#e5e8ee] bg-[#fbfcfd] px-3.5 py-2.5 text-sm last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r"
          >
            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-[#98a2b3]">{index + 1}</span>
            <code className="truncate font-mono text-[13px] text-[#344054]" title={consumerId}>
              {consumerId}
            </code>
          </li>
        ))}
      </ol>
    </div>
  )
}
