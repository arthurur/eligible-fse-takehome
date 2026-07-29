export type CohortFilterValues = {
  firm: string
  daysSinceLastEmail: string
  noSessionSince: string
  hasOpenMortgage: string
}

export type CohortResponse = {
  count: number
  consumer_ids: string[]
  filters_applied: {
    firm: string
    days_since_last_email: number
    no_session_since: string | null
    has_open_mortgage: boolean
  }
  queried_at: string
  product_type_summary: Record<string, number>
  unmapped_product_types: string[]
}

export type RequestError = {
  status?: number
  message: string
}

export type FirmSuggestionStatus = 'loading' | 'ready' | 'error'
