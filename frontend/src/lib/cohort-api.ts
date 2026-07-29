import type { CohortFilterValues, CohortResponse, RequestError } from '../types/cohort'

type ApiErrorBody = {
  detail?: string | Array<{ loc?: Array<string | number>; msg?: string }>
}

type FirmListResponse = {
  firms: string[]
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001').replace(/\/$/, '')

function formatError(status: number, body: ApiErrorBody): string {
  if (typeof body.detail === 'string') return body.detail

  if (Array.isArray(body.detail)) {
    return body.detail
      .map((issue) => {
        const field = issue.loc?.at(-1)
        return field && issue.msg ? `${String(field)}: ${issue.msg}` : issue.msg
      })
      .filter(Boolean)
      .join('. ')
  }

  return `The cohort service returned an unexpected ${status} response.`
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody | T

  if (!response.ok) {
    throw {
      status: response.status,
      message: formatError(response.status, body as ApiErrorBody),
    } satisfies RequestError
  }

  return body as T
}

export async function getFirmSuggestions(signal?: AbortSignal): Promise<string[]> {
  const response = await getJson<FirmListResponse>('/firms', signal)
  return response.firms
}

export function queryCohort(filters: CohortFilterValues, signal?: AbortSignal): Promise<CohortResponse> {
  const params = new URLSearchParams({
    firm: filters.firm.trim(),
    days_since_last_email: filters.daysSinceLastEmail,
    has_open_mortgage: filters.hasOpenMortgage,
  })

  if (filters.noSessionSince) {
    params.set('no_session_since', new Date(filters.noSessionSince).toISOString())
  }

  return getJson<CohortResponse>(`/cohort?${params.toString()}`, signal)
}

export function normalizeRequestError(caught: unknown): RequestError {
  const error = caught as Partial<RequestError>
  return {
    status: error.status,
    message:
      error.message === 'Failed to fetch'
        ? 'The cohort service could not be reached. Confirm the API is running and try again.'
        : error.message || 'The cohort query could not be completed.',
  }
}
