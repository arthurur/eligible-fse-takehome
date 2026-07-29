import type { RequestError } from '../../types/cohort'
import { WarningIcon } from '../ui/WarningIcon'

export function InitialQueryState() {
  return (
    <div className="grid min-h-[470px] place-items-center rounded-2xl border border-dashed border-[#cbd1dc] bg-white px-6 py-14 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e9edff] text-[#1637d6]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-current stroke-[1.8]">
            <path d="M16 20v-1.7a3.3 3.3 0 0 0-3.3-3.3H6.3A3.3 3.3 0 0 0 3 18.3V20M9.5 11.5A3.75 3.75 0 1 0 9.5 4a3.75 3.75 0 0 0 0 7.5ZM16 11l2 2 3-4" />
          </svg>
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#172033]">Ready to build a cohort</h2>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Search for a firm and confirm the eligibility rules. Results and product-mapping coverage will appear here.
        </p>
      </div>
    </div>
  )
}

export function LoadingQueryState() {
  return (
    <div className="min-h-[470px] rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(17,32,51,0.07)] sm:p-8">
      <div className="flex items-center justify-between border-b border-[#e5e8ee] pb-6">
        <div>
          <div className="h-3 w-24 animate-pulse rounded bg-[#e3e7ee]" />
          <div className="mt-3 h-9 w-40 animate-pulse rounded-lg bg-[#d9deea]" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-[#e8ebf1]" />
      </div>
      <div className="grid gap-8 pt-8 xl:grid-cols-2">
        {[0, 1].map((column) => (
          <div key={column} className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-[#dfe3eb]" />
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-11 animate-pulse rounded-xl bg-[#f0f2f6]" />
            ))}
          </div>
        ))}
      </div>
      <p className="sr-only">Loading cohort preview</p>
    </div>
  )
}

export function ErrorQueryState({ error }: { error: RequestError }) {
  const isForbidden = error.status === 403

  return (
    <div
      role="alert"
      className={`rounded-2xl p-6 shadow-[0_8px_28px_rgba(17,32,51,0.07)] sm:p-8 ${
        isForbidden ? 'bg-[#fff7e8] text-[#572e06]' : 'bg-white text-[#172033]'
      }`}
    >
      <div className={`grid size-11 place-items-center rounded-xl ${isForbidden ? 'bg-[#ffdf9d]' : 'bg-[#fee4e2] text-[#b42318]'}`}>
        <WarningIcon />
      </div>
      <p className="mt-6 text-xs font-bold tracking-[0.12em] uppercase">{isForbidden ? 'Access denied' : 'Query failed'}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
        {isForbidden ? 'This firm is not allowed' : 'The cohort could not be loaded'}
      </h2>
      <p className={`mt-3 max-w-xl text-sm leading-6 ${isForbidden ? 'text-[#74450f]' : 'text-[#667085]'}`}>
        {error.message}
      </p>
      <p className={`mt-5 text-sm font-medium ${isForbidden ? 'text-[#572e06]' : 'text-[#344054]'}`}>
        {isForbidden
          ? 'Check the firm identifier or ask an administrator to review firm access.'
          : 'Review the filters, confirm the API is available, and run the query again.'}
      </p>
    </div>
  )
}
