import type { CohortResponse, CohortViewMode, RequestError } from '../../types/cohort'
import { CohortResult } from './CohortResult'
import { ErrorQueryState, InitialQueryState, LoadingQueryState } from './QueryStates'

type CohortPreviewProps = {
  error: RequestError | null
  isLoading: boolean
  result: CohortResponse | null
  viewMode: CohortViewMode
  cumulativeCount: number | null
  onViewModeChange: (mode: CohortViewMode) => void
}

export function CohortPreview({
  error,
  isLoading,
  result,
  viewMode,
  cumulativeCount,
  onViewModeChange,
}: CohortPreviewProps) {
  return (
    <section aria-live="polite" aria-busy={isLoading} className="min-w-0">
      {isLoading && <LoadingQueryState />}
      {!isLoading && error && <ErrorQueryState error={error} />}
      {!isLoading && !error && result && (
        <CohortResult
          result={result}
          viewMode={viewMode}
          cumulativeCount={cumulativeCount}
          onViewModeChange={onViewModeChange}
        />
      )}
      {!isLoading && !error && !result && <InitialQueryState />}
    </section>
  )
}
