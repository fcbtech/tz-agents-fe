import FieldRow from '@/components/chat/po-preview/FieldRow'
import SectionHeading from '@/components/chat/po-preview/SectionHeading'
import type { PODraft } from '@/lib/types/documents'
import { formatCurrencyLabel, formatPlaceOfSupply } from '@/lib/utils/po-format'

interface Row {
  label: string
  value: string | undefined
  showPending?: boolean
}

function FieldGroup({ title, rows }: { title: string; rows: Row[] }) {
  const visible = rows.filter((r) => Boolean(r.value?.trim()) || r.showPending)
  if (!visible.length) return null
  return (
    <>
      <SectionHeading>{title}</SectionHeading>
      {visible.map((r) => (
        <FieldRow
          key={r.label}
          label={r.label}
          value={r.value}
          showPending={r.showPending}
        />
      ))}
    </>
  )
}

function trimOrUndefined(value?: string) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export default function POHeaderFields({ draft }: { draft: PODraft }) {
  const pd = draft.primary_document_details
  const buyer = draft.buyer_details
  const supplier = draft.supplier_details
  const add = draft.additional_document_details
  const cv = draft.currency.currency_value

  const documentRows: Row[] = [
    { label: 'Transaction', value: draft.transaction.title?.trim() },
    {
      label: 'Document Number',
      value: pd.doc_number?.value?.trim(),
    },
    { label: 'Currency', value: formatCurrencyLabel(cv) },
  ]

  const partiesRows: Row[] = [
    {
      label: 'Buyer',
      value: trimOrUndefined(buyer.buyer_company_details?.name),
      showPending: true,
    },
    {
      label: 'Buyer Billing Address',
      value: trimOrUndefined(buyer.selected_buyer_billing_address?.name),
    },
    {
      label: 'Supplier',
      value: trimOrUndefined(supplier.supplier_company_details?.name),
      showPending: true,
    },
    {
      label: 'Supplier Billing Address',
      value: trimOrUndefined(supplier.selected_supplier_billing_address?.name),
    },
  ]

  const deliveryRows: Row[] = [
    {
      label: 'Store',
      value: trimOrUndefined(pd.store_details?.name),
      showPending: true,
    },
    {
      label: 'Delivery Date',
      value: trimOrUndefined(pd.delivery_date),
      showPending: true,
    },
    {
      label: 'Delivery Location',
      value: trimOrUndefined(buyer.selected_buyer_delivery_location?.name),
    },
    {
      label: 'Place of Supply',
      value: formatPlaceOfSupply(buyer.place_of_supply),
    },
    { label: 'Kind Attention', value: buyer.kind_attention?.trim() },
  ]

  const referenceRows: Row[] = [
    { label: 'OC Number', value: pd.oc_details?.oc_number?.trim() },
    { label: 'OC Date', value: pd.oc_details?.oc_date?.trim() },
    {
      label: 'Indent Number',
      value: pd.indent_details?.indent_number?.trim(),
    },
    {
      label: 'Indent Date',
      value: pd.indent_details?.indent_date?.trim(),
    },
  ]

  const termsRows: Row[] = [
    {
      label: 'Payment Terms',
      value: trimOrUndefined(pd.payment_terms?.name),
      showPending: true,
    },
    {
      label: 'Logistics',
      value: trimOrUndefined(add.selected_logistic_details?.name),
      showPending: true,
    },
    {
      label: 'Terms & Conditions',
      value: trimOrUndefined(add.selected_terms_and_conditions?.name),
      showPending: true,
    },
  ]

  const customFieldsFilled = (pd.custom_fields ?? []).filter(
    (cf) => Boolean(cf.name?.trim()) && Boolean(cf.value.trim()),
  )

  return (
    <div className="space-y-1">
      <FieldGroup title="Document Info" rows={documentRows} />
      <FieldGroup title="Parties" rows={partiesRows} />
      <FieldGroup title="Delivery" rows={deliveryRows} />
      <FieldGroup title="Reference Numbers" rows={referenceRows} />
      <FieldGroup title="Terms" rows={termsRows} />

      {trimOrUndefined(draft.comment?.value) ? (
        <>
          <SectionHeading>Comment</SectionHeading>
          <FieldRow label="Comment" value={draft.comment.value} />
        </>
      ) : null}

      {customFieldsFilled.length ? (
        <>
          <SectionHeading>Custom Fields</SectionHeading>
          {customFieldsFilled.map((cf) => (
            <FieldRow key={cf.uuid} label={cf.name} value={cf.value} />
          ))}
        </>
      ) : null}
    </div>
  )
}
