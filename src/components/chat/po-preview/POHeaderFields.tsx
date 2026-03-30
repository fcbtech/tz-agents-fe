import FieldRow from '@/components/chat/po-preview/FieldRow'
import SectionHeading from '@/components/chat/po-preview/SectionHeading'
import type { PODraft } from '@/lib/types/documents'
import { formatCurrencyLabel, formatPlaceOfSupply } from '@/lib/utils/po-format'

function nonEmpty(s: string | undefined): string | undefined {
  const t = s?.trim()
  return t ? t : undefined
}

interface Row {
  label: string
  value: string | undefined
}

function FieldGroup({ title, rows }: { title: string; rows: Row[] }) {
  const filled = rows.filter((r) => r.value !== undefined && r.value !== '')
  if (!filled.length) return null
  return (
    <>
      <SectionHeading>{title}</SectionHeading>
      {filled.map((r) => (
        <FieldRow key={r.label} label={r.label} value={r.value} />
      ))}
    </>
  )
}

export default function POHeaderFields({ draft }: { draft: PODraft }) {
  const pd = draft.primary_document_details
  const buyer = draft.buyer_details
  const supplier = draft.supplier_details
  const add = draft.additional_document_details
  const cv = draft.currency.currency_value

  const documentRows: Row[] = [
    { label: 'Transaction', value: nonEmpty(draft.transaction.title) },
    {
      label: 'Document Number',
      value: nonEmpty(pd.doc_number?.value),
    },
    { label: 'Currency', value: formatCurrencyLabel(cv) },
  ]

  const partiesRows: Row[] = [
    {
      label: 'Buyer',
      value: nonEmpty(buyer.buyer_company_details?.name),
    },
    {
      label: 'Buyer Billing Address',
      value: nonEmpty(buyer.selected_buyer_billing_address?.name),
    },
    {
      label: 'Supplier',
      value: nonEmpty(supplier.supplier_company_details?.name),
    },
    {
      label: 'Supplier Billing Address',
      value: nonEmpty(supplier.selected_supplier_billing_address?.name),
    },
  ]

  const deliveryRows: Row[] = [
    { label: 'Store', value: nonEmpty(pd.store_details?.name) },
    { label: 'Delivery Date', value: nonEmpty(pd.delivery_date) },
    {
      label: 'Delivery Location',
      value: nonEmpty(buyer.selected_buyer_delivery_location?.name),
    },
    {
      label: 'Place of Supply',
      value: formatPlaceOfSupply(buyer.place_of_supply),
    },
    { label: 'Kind Attention', value: nonEmpty(buyer.kind_attention) },
  ]

  const referenceRows: Row[] = [
    { label: 'OC Number', value: nonEmpty(pd.oc_details?.oc_number) },
    { label: 'OC Date', value: nonEmpty(pd.oc_details?.oc_date) },
    {
      label: 'Indent Number',
      value: nonEmpty(pd.indent_details?.indent_number),
    },
    {
      label: 'Indent Date',
      value: nonEmpty(pd.indent_details?.indent_date),
    },
  ]

  const termsRows: Row[] = [
    {
      label: 'Payment Terms',
      value: nonEmpty(pd.payment_terms?.name),
    },
    {
      label: 'Logistics',
      value: nonEmpty(add.selected_logistic_details?.name),
    },
    {
      label: 'Terms & Conditions',
      value: nonEmpty(add.selected_terms_and_conditions?.name),
    },
  ]

  const customFields = pd.custom_fields ?? []
  const anyCustomFilled = customFields.some((cf) => nonEmpty(cf.value))

  return (
    <div className="space-y-1">
      <FieldGroup title="Document Info" rows={documentRows} />
      <FieldGroup title="Parties" rows={partiesRows} />
      <FieldGroup title="Delivery" rows={deliveryRows} />
      <FieldGroup title="Reference Numbers" rows={referenceRows} />
      <FieldGroup title="Terms" rows={termsRows} />

      {draft.comment?.value ? (
        <>
          <SectionHeading>Comment</SectionHeading>
          <FieldRow label="Comment" value={draft.comment.value} />
        </>
      ) : null}

      {anyCustomFilled ? (
        <>
          <SectionHeading>Custom Fields</SectionHeading>
          {customFields.map((cf) => (
            <FieldRow
              key={cf.uuid}
              label={cf.name}
              value={nonEmpty(cf.value)}
            />
          ))}
        </>
      ) : null}
    </div>
  )
}
