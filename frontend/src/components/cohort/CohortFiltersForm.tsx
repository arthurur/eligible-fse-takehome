import { useState, type FormEvent } from 'react'
import type { CohortFilterValues, FirmSuggestionStatus } from '../../types/cohort'
import { AutocompleteField } from '../form/AutocompleteField'
import { SelectField } from '../form/SelectField'
import { TextField } from '../form/TextField'

const initialFilters: CohortFilterValues = {
  firm: '',
  daysSinceLastEmail: '3',
  noSessionSince: '',
  hasOpenMortgage: 'true',
}

type CohortFiltersFormProps = {
  firmSuggestions: string[]
  firmSuggestionStatus: FirmSuggestionStatus
  isSubmitting: boolean
  onSubmit: (filters: CohortFilterValues) => void
}

export function CohortFiltersForm({
  firmSuggestions,
  firmSuggestionStatus,
  isSubmitting,
  onSubmit,
}: CohortFiltersFormProps) {
  const [filters, setFilters] = useState(initialFilters)

  function updateFilter(name: keyof CohortFilterValues, value: string) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ ...filters, firm: filters.firm.trim() })
  }

  return (
    <aside className="rounded-2xl bg-[#111c38] p-5 text-white shadow-[0_16px_40px_rgba(17,28,56,0.14)] sm:p-6 lg:sticky lg:top-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Cohort filters</h2>
        <p className="mt-1 text-sm leading-5 text-[#b9c2d7]">All four rules are sent with every query.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AutocompleteField
          id="firm"
          name="firm"
          label="Firm"
          value={filters.firm}
          onChange={(value) => updateFilter('firm', value)}
          options={firmSuggestions}
          status={firmSuggestionStatus}
          required
          placeholder="Search firms"
          description="Firm access is checked by the service."
        />

        <TextField
          id="days-since-email"
          name="days_since_last_email"
          label="Days since last email"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={filters.daysSinceLastEmail}
          onChange={(value) => updateFilter('daysSinceLastEmail', value)}
          required
          suffix="days"
        />

        <TextField
          id="no-session-since"
          name="no_session_since"
          label={
            <>
              No session since <span className="font-normal text-[#9eabc5]">(optional)</span>
            </>
          }
          type="datetime-local"
          value={filters.noSessionSince}
          onChange={(value) => updateFilter('noSessionSince', value)}
          description="Uses your local time and sends it as UTC."
          className="scheme-dark"
        />

        <SelectField
          id="mortgage-status"
          name="has_open_mortgage"
          label="Mortgage status"
          value={filters.hasOpenMortgage}
          onChange={(value) => updateFilter('hasOpenMortgage', value)}
          options={[
            { label: 'Open mortgage', value: 'true' },
            { label: 'No open mortgage', value: 'false' },
          ]}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#5d78ff] px-4 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(93,120,255,0.3)] transition hover:bg-[#718aff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b6c2ff] disabled:cursor-wait disabled:bg-[#475575] disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              Running query…
            </>
          ) : (
            <>
              Preview cohort
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>
    </aside>
  )
}
