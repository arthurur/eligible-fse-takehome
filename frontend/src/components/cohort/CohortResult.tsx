import type { CohortResponse, CohortViewMode } from '../../types/cohort'
import { WarningIcon } from '../ui/WarningIcon'
import { ConsumerPreview } from './ConsumerPreview'
import { ProductCoverage } from './ProductCoverage'

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

type CohortResultProps = {
  result: CohortResponse
  viewMode: CohortViewMode
  cumulativeCount: number | null
  onViewModeChange: (mode: CohortViewMode) => void
}

export function CohortResult({
  result,
  viewMode,
  cumulativeCount,
  onViewModeChange,
}: CohortResultProps) {
  const showViewToggle =
    cumulativeCount !== null &&
    cumulativeCount > result.cumulative_view_threshold

  return (
    <div>
      <div className="rounded-2xl bg-white px-6 py-6 shadow-[0_8px_28px_rgba(17,32,51,0.07)] sm:px-8">
        <div className="flex flex-col gap-5 border-b border-[#e5e8ee] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-[#667085] uppercase">
              Eligible consumers
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <p className="text-4xl font-semibold tracking-[-0.04em] text-[#111827] sm:text-5xl">
                {result.count.toLocaleString()}
              </p>
              <span className="text-sm text-[#667085]">matched</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold text-[#344054]">
              {result.filters_applied.firm}
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              Queried {formatTimestamp(result.queried_at)}
            </p>
          </div>
        </div>

        {showViewToggle && (
          <fieldset className="border-b border-[#e5e8ee] py-5">
            <div
              className="grid gap-2 sm:grid-cols-2"
              aria-label="Email eligibility view"
            >
              <button
                type="button"
                aria-pressed={viewMode === 'cumulative'}
                onClick={() => onViewModeChange('cumulative')}
                className="min-h-11 rounded-xl border border-[#d7dce5] px-4 py-2.5 text-left text-sm font-semibold text-[#475467] transition hover:border-[#9eabc5] hover:bg-[#f8f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1637d6] aria-pressed:border-[#1637d6] aria-pressed:bg-[#eef1ff] aria-pressed:text-[#1637d6]"
              >
                Cumulative view
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'recent-email-guardrail'}
                onClick={() => onViewModeChange('recent-email-guardrail')}
                className="min-h-11 rounded-xl border border-[#d7dce5] px-4 py-2.5 text-left text-sm font-semibold text-[#475467] transition hover:border-[#9eabc5] hover:bg-[#f8f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1637d6] aria-pressed:border-[#1637d6] aria-pressed:bg-[#eef1ff] aria-pressed:text-[#1637d6]"
              >
                Exclude anyone emailed in the last 3 days
              </button>
            </div>
          </fieldset>
        )}

        {result.unmapped_product_types.length > 0 && (
          <div
            role="alert"
            className="mt-7 flex gap-3 rounded-xl bg-[#fff0c7] px-5 py-4 text-[#633b08] sm:px-6"
          >
            <WarningIcon />
            <div>
              <h2 className="text-sm font-semibold">
                Unmapped product types need review
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#74450f]">
                These records count toward the cohort total but not the
                canonical product summary:{' '}
                <strong>{result.unmapped_product_types.join(', ')}</strong>.
              </p>
            </div>
          </div>
        )}

        {result.count === 0 ? (
          <div className="py-12 text-center">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#172033]">
              No consumers match these rules
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667085]">
              Broaden one or more filters and run the query again. No IDs or
              product categories were returned.
            </p>
          </div>
        ) : (
          <div className="grid gap-10 pt-7 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)]">
            <ProductCoverage summary={result.product_type_summary} />
            <ConsumerPreview
              key={result.queried_at}
              consumers={result.consumer_previews}
              firm={result.filters_applied.firm}
              totalCount={result.count}
            />
          </div>
        )}
      </div>
    </div>
  )
}
