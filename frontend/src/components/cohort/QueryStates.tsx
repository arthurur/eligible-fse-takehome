import type { CSSProperties } from 'react'
import type { RequestError } from '../../types/cohort'
import { WarningIcon } from '../ui/WarningIcon'

const productCoverageWidths = ['79%', '34%', '100%', '27%', '27%']
const consumerPreviewCells = Array.from({ length: 20 }, (_, index) => index)

function SkeletonBlock({ className, style }: { className: string; style?: CSSProperties }) {
  return <span className={`block animate-pulse bg-[#e3e7ee] ${className}`} style={style} />
}

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
    <div
      role="status"
      className="rounded-2xl bg-white px-6 py-6 shadow-[0_8px_28px_rgba(17,32,51,0.07)] sm:px-8"
    >
      <div aria-hidden="true">
        <div className="flex flex-col gap-5 border-b border-[#e5e8ee] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SkeletonBlock className="h-3 w-32 rounded" />
            <div className="mt-3 flex items-end gap-3">
              <SkeletonBlock className="h-12 w-24 rounded-lg bg-[#d9deea]" />
              <SkeletonBlock className="mb-1 h-4 w-16 rounded" />
            </div>
          </div>
          <div className="space-y-2 sm:flex sm:flex-col sm:items-end">
            <SkeletonBlock className="h-4 w-24 rounded" />
            <SkeletonBlock className="h-3 w-44 max-w-full rounded" />
          </div>
        </div>

        <div className="border-b border-[#e5e8ee] py-5">
          <SkeletonBlock className="h-4 w-36 rounded" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <SkeletonBlock className="h-11 rounded-xl bg-[#edf0f5]" />
            <SkeletonBlock className="h-11 rounded-xl bg-[#edf0f5]" />
          </div>
        </div>

        <div className="grid gap-10 pt-7 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)]">
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <SkeletonBlock className="h-5 w-36 rounded" />
              <SkeletonBlock className="h-3 w-24 rounded" />
            </div>
            <div className="space-y-5">
              {productCoverageWidths.map((width, index) => (
                <div key={index}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <SkeletonBlock className="h-4 w-28 rounded" />
                    <SkeletonBlock className="h-4 w-7 rounded" />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#edf0f5]">
                    <SkeletonBlock className="h-full rounded-full bg-[#d9deea]" style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <SkeletonBlock className="h-5 w-36 rounded" />
              <SkeletonBlock className="h-3 w-24 rounded" />
            </div>
            <div className="grid overflow-hidden rounded-xl border border-[#dde1e8] sm:grid-cols-2">
              {consumerPreviewCells.map((cell) => (
                <div
                  key={cell}
                  className="flex h-[42px] items-center gap-3 border-b border-[#e5e8ee] bg-[#fbfcfd] px-3.5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r"
                >
                  <SkeletonBlock className="h-3 w-5 shrink-0 rounded" />
                  <SkeletonBlock className="h-3 w-24 max-w-[60%] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
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
