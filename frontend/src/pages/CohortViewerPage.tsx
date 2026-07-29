import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { CohortFiltersForm } from '../components/cohort/CohortFiltersForm'
import { CohortPreview } from '../components/cohort/CohortPreview'
import { getFirmSuggestions, normalizeRequestError, queryCohort } from '../lib/cohort-api'
import type {
  CohortFilterValues,
  CohortResponse,
  CohortViewMode,
  FirmSuggestionStatus,
  RequestError,
} from '../types/cohort'

const RECENT_EMAIL_GUARDRAIL_DAYS = 3

type CohortResultsByMode = Partial<Record<CohortViewMode, CohortResponse>>

/*
THESIS: A calm query desk that puts cohort guardrails beside the resulting evidence.
OWN-WORLD: Ink, paper, cobalt, and amber; squared data rows with restrained rounding.
STORY: Set eligibility rules, run a query, inspect coverage, then review consumer IDs.
FIRST VIEWPORT: Persistent filters at left; result status and operational detail at right.
FORM: Split-pane operator console, with threshold-triggered outreach controls in the result.
*/

function isAbortError(caught: unknown): boolean {
  return caught instanceof Error && caught.name === 'AbortError'
}

export function CohortViewerPage() {
  const [firmSuggestions, setFirmSuggestions] = useState<string[]>([])
  const [firmSuggestionStatus, setFirmSuggestionStatus] = useState<FirmSuggestionStatus>('loading')
  const [error, setError] = useState<RequestError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submittedFilters, setSubmittedFilters] = useState<CohortFilterValues | null>(null)
  const [viewMode, setViewMode] = useState<CohortViewMode>('cumulative')
  const [resultsByMode, setResultsByMode] = useState<CohortResultsByMode>({})
  const queryController = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    getFirmSuggestions(controller.signal)
      .then((firms) => {
        setFirmSuggestions(firms)
        setFirmSuggestionStatus('ready')
      })
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) setFirmSuggestionStatus('error')
      })

    return () => controller.abort()
  }, [])

  useEffect(() => () => queryController.current?.abort(), [])

  async function runQuery(filters: CohortFilterValues, mode: CohortViewMode) {
    queryController.current?.abort()
    const controller = new AbortController()
    queryController.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const daysSinceLastEmail = mode === 'cumulative' ? 0 : RECENT_EMAIL_GUARDRAIL_DAYS
      const nextResult = await queryCohort(filters, daysSinceLastEmail, controller.signal)

      if (queryController.current !== controller) return

      setResultsByMode((current) => ({ ...current, [mode]: nextResult }))
      setViewMode(mode)
    } catch (caught) {
      if (!isAbortError(caught)) setError(normalizeRequestError(caught))
    } finally {
      if (queryController.current === controller) {
        queryController.current = null
        setIsLoading(false)
      }
    }
  }

  function handleSubmit(filters: CohortFilterValues) {
    setSubmittedFilters(filters)
    setViewMode('cumulative')
    setResultsByMode({})
    void runQuery(filters, 'cumulative')
  }

  function handleViewModeChange(mode: CohortViewMode) {
    if (!submittedFilters || mode === viewMode) return

    const cachedResult = resultsByMode[mode]
    if (cachedResult) {
      setError(null)
      setViewMode(mode)
      return
    }

    void runQuery(submittedFilters, mode)
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#172033]">
      <AppHeader />

      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-11">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-bold tracking-[0.12em] text-[#1637d6] uppercase">Recovery eligibility</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#111827] sm:text-4xl">Build a consumer cohort</h1>
          <p className="mt-3 max-w-[65ch] text-sm leading-6 text-[#667085] sm:text-base">
            Apply outreach and activity rules, then review product coverage before using the cohort downstream.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <CohortFiltersForm
            firmSuggestions={firmSuggestions}
            firmSuggestionStatus={firmSuggestionStatus}
            isSubmitting={isLoading}
            onSubmit={handleSubmit}
          />
          <CohortPreview
            isLoading={isLoading}
            error={error}
            result={resultsByMode[viewMode] ?? null}
            viewMode={viewMode}
            cumulativeCount={resultsByMode.cumulative?.count ?? null}
            onViewModeChange={handleViewModeChange}
          />
        </div>
      </main>
    </div>
  )
}
