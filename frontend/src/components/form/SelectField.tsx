import type { ReactNode } from 'react'
import { Field, inputClassName } from './Field'

type SelectOption = {
  label: string
  value: string
}

type SelectFieldProps = {
  description?: ReactNode
  id: string
  label: ReactNode
  name: string
  onChange: (value: string) => void
  options: SelectOption[]
  value: string
}

export function SelectField({ description, id, label, name, onChange, options, value }: SelectFieldProps) {
  return (
    <Field id={id} label={label} description={description}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={description ? `${id}-description` : undefined}
        className={inputClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}
