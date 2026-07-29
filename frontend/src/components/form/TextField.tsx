import type { ComponentProps, ReactNode } from 'react'
import { Field, inputClassName } from './Field'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id' | 'onChange' | 'value'> & {
  description?: ReactNode
  id: string
  label: ReactNode
  onChange: (value: string) => void
  suffix?: ReactNode
  value: string
}

export function TextField({ className = '', description, id, label, onChange, suffix, value, ...inputProps }: TextFieldProps) {
  return (
    <Field id={id} label={label} description={description}>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={description ? `${id}-description` : undefined}
          className={`${inputClassName} ${suffix ? 'pr-14' : ''} ${className}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs text-[#9eabc5]">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  )
}
