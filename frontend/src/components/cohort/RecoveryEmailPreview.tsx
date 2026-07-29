import type { ConsumerPreviewData } from '../../types/cohort'

type RecoveryEmailPreviewProps = {
  consumer: ConsumerPreviewData
  firm: string
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
  }).format(new Date(value))
}

function RecoveryEmail({ consumer, firm }: RecoveryEmailPreviewProps) {
  const productType = consumer.product_type_canonical ?? 'mortgage account'

  return (
    <>
      <p>Hi from {firm},</p>
      {consumer.last_session_at ? (
        <p>
          We noticed you haven&apos;t been back to your mortgage account since{' '}
          {formatSessionDate(consumer.last_session_at)}.
        </p>
      ) : (
        <p>
          We noticed you haven&apos;t logged in to your mortgage account yet.
        </p>
      )}
      <p>
        We&apos;ve made some updates that might be relevant to your{' '}
        {productType}.
      </p>
      <p>Click here to log in.</p>
    </>
  )
}

export function RecoveryEmailPreview({
  consumer,
  firm,
}: RecoveryEmailPreviewProps) {
  return (
    <section
      id="recovery-email-preview"
      aria-label={`Recovery email preview for ${consumer.consumer_id}`}
      className="col-span-full mt-5 w-full rounded-xl bg-[#eef1ff] px-5 py-5 text-[#172033]"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Recovery email preview</h3>
        <code className="font-mono text-xs text-[#53617a]">
          {consumer.consumer_id}
        </code>
      </div>
      <div className="max-w-[68ch] space-y-4 text-sm leading-6">
        <RecoveryEmail consumer={consumer} firm={firm} />
      </div>
      {!consumer.product_type_canonical && (
        <p className="mt-5 border-t border-[#cfd6f5] pt-3 text-xs leading-5 text-[#4b5873]">
          This consumer&apos;s product type is unmapped, so the preview uses
          “mortgage account” as a safe fallback.
        </p>
      )}
    </section>
  )
}
