import { useState } from 'react'
import type { ConsumerPreviewData } from '../../types/cohort'
import { RecoveryEmailPreview } from './RecoveryEmailPreview'

type ConsumerPreviewProps = {
  consumers: ConsumerPreviewData[]
  firm: string
  totalCount: number
}

export function ConsumerPreview({ consumers, firm, totalCount }: ConsumerPreviewProps) {
  const [selectedConsumerIndex, setSelectedConsumerIndex] = useState<number | null>(null)
  const selectedConsumer =
    selectedConsumerIndex === null ? null : (consumers[selectedConsumerIndex] ?? null)

  function togglePreview(consumerIndex: number) {
    setSelectedConsumerIndex((current) => (current === consumerIndex ? null : consumerIndex))
  }

  return (
    <div className="grid sm:grid-cols-2">
      <div className="col-span-full mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#172033]">Consumer preview</h2>
        <span className="text-xs text-[#667085]">
          First {consumers.length} of {totalCount.toLocaleString()}
        </span>
      </div>
      <ol className="col-span-full grid overflow-hidden rounded-xl border border-[#dde1e8] sm:grid-cols-2">
        {consumers.map((consumer, index) => {
          const isSelected = index === selectedConsumerIndex

          return (
            <li
              key={`${consumer.consumer_id}-${index}`}
              className="flex min-w-0 items-center gap-2 border-b border-[#e5e8ee] bg-[#fbfcfd] px-3.5 py-2.5 text-sm last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r"
            >
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-[#98a2b3]">{index + 1}</span>
              <code
                className="min-w-0 flex-1 truncate font-mono text-[13px] text-[#344054]"
                title={consumer.consumer_id}
              >
                {consumer.consumer_id}
              </code>
              <button
                type="button"
                aria-expanded={isSelected}
                aria-controls="recovery-email-preview"
                onClick={() => togglePreview(index)}
                className="min-h-9 shrink-0 rounded-lg px-2.5 text-xs font-semibold text-[#1637d6] transition hover:bg-[#eef1ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1637d6]"
              >
                {isSelected ? 'Close' : 'Preview email'}
              </button>
            </li>
          )
        })}
      </ol>

      {selectedConsumer && (
        <RecoveryEmailPreview consumer={selectedConsumer} firm={firm} />
      )}
    </div>
  )
}
