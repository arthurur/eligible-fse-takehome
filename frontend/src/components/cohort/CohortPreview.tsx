import type { CohortResponse, RequestError } from '../../types/cohort'
import { CohortResult } from './CohortResult'
import { ErrorQueryState, InitialQueryState, LoadingQueryState } from './QueryStates'

type CohortPreviewProps = {
  error: RequestError | null
  isLoading: boolean
  result: CohortResponse | null
}

export function CohortPreview({ error, isLoading, result }: CohortPreviewProps) {
  return (
    <section aria-live="polite" aria-busy={isLoading} className="min-w-0">
      {isLoading && <LoadingQueryState />}
      {!isLoading && error && <ErrorQueryState error={error} />}
      {!isLoading && !error && result && <CohortResult result={result} />}
      {!isLoading && !error && !result && <InitialQueryState />}
    </section>
  )
}
