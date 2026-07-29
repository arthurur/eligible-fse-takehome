import type { ReactNode } from 'react'

type FieldProps = {
  children: ReactNode
  description?: ReactNode
  id: string
  label: ReactNode
}

export const inputClassName =
  'h-11 w-full rounded-xl border border-[#3a4665] bg-[#1a2747] px-3.5 text-sm text-white outline-none transition placeholder:text-[#8792ad] hover:border-[#596783] focus:border-[#8ea2ff] focus:ring-3 focus:ring-[#5d78ff]/25'

export function Field({ children, description, id, label }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-[#eef2ff]">
        {label}
      </label>
      {children}
      {description && (
        <p id={`${id}-description`} className="mt-1.5 text-xs leading-5 text-[#9eabc5]">
          {description}
        </p>
      )}
    </div>
  )
}
