import type { ReactNode } from 'react'
import type { FirmSuggestionStatus } from '../../types/cohort'
import { Field, inputClassName } from './Field'

type AutocompleteFieldProps = {
  description?: ReactNode
  id: string
  label: ReactNode
  name: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  required?: boolean
  status?: FirmSuggestionStatus
  value: string
}

export function AutocompleteField({
  description,
  id,
  label,
  name,
  onChange,
  options,
  placeholder,
  required,
  status = 'ready',
  value,
}: AutocompleteFieldProps) {
  const suggestionListId = `${id}-suggestions`
  const helperText = {
    loading: 'Loading firm suggestions…',
    error: 'Suggestions are unavailable. You can still enter a firm identifier manually.',
    ready: description,
  }[status]

  return (
    <Field id={id} label={label} description={helperText}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          list={status === 'ready' ? suggestionListId : undefined}
          required={required}
          maxLength={100}
          autoComplete="off"
          placeholder={placeholder}
          aria-describedby={`${id}-description`}
          className={`${inputClassName} pr-10`}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 fill-none stroke-[#9eabc5] stroke-2"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <datalist id={suggestionListId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
    </Field>
  )
}
