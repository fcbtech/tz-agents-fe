import FieldRow from '@/components/chat/po-preview/FieldRow'
import SectionHeading from '@/components/chat/po-preview/SectionHeading'
import type { PODraft } from '@/lib/types/documents'

export default function POFooterFields({ draft }: { draft: PODraft }) {
  const bankName =
    draft.additional_document_details.selected_account_details?.name?.trim()
  const showBank = Boolean(bankName)
  const showSig = draft.attach_signature === true

  if (!showBank && !showSig) return null

  return (
    <div className="mt-6 space-y-1">
      <SectionHeading>Additional Details</SectionHeading>
      {showBank ? <FieldRow label="Bank Account" value={bankName} /> : null}
      {showSig ? <FieldRow label="Signature" value="Attached" /> : null}
    </div>
  )
}
