/**
 * Frontend mirrors of backend Pydantic models (models/po_draft.py).
 * The backend sends `draft.model_dump(exclude_none=True)` directly,
 * so these types match the serialized PODraft structure.
 */

export interface IdRef {
  id: string
  name: string
}

export interface CompanyRef {
  company_id: string
  name?: string
}

export interface PlaceOfSupply {
  city?: string
  state?: string
  country?: string
}

export interface BuyerDetails {
  buyer_company_details?: CompanyRef
  selected_buyer_billing_address?: IdRef
  selected_buyer_delivery_location?: IdRef
  kind_attention?: string
  place_of_supply?: PlaceOfSupply
}

export interface SupplierDetails {
  supplier_company_details?: CompanyRef
  selected_supplier_billing_address?: IdRef
}

export interface ItemDiscount {
  type: number
  value: number
}

export interface CustomField {
  uuid: string
  name: string
  value: string
}

export interface POItem {
  product: string
  name: string
  quantity?: string
  unit?: IdRef
  price?: number
  hsn_code?: string
  taxes?: IdRef[]
  comment?: string
  alternate_unit?: IdRef
  alternate_quantity?: number
  delivery_date?: string
  item_discount_type_1?: ItemDiscount
  item_discount_type_2?: ItemDiscount
  item_discount_type_3?: ItemDiscount
  custom_fields?: CustomField[]
}

export interface ItemDetails {
  items: POItem[]
}

export interface DocNumber {
  id?: string
  value?: string
}

export interface PrimaryDocumentDetails {
  doc_number?: DocNumber
  delivery_date?: string
  payment_terms?: IdRef
  store_details?: IdRef
  custom_fields?: CustomField[]
}

export interface AmountDetails {
  reverse_charge?: boolean
  grand_total_round_off?: boolean
  base_advance_to_pay?: number
}

export interface AdditionalDocumentDetails {
  selected_logistic_details?: IdRef
  selected_terms_and_conditions?: IdRef
  selected_account_details?: IdRef
}

export interface GstExtraCharge {
  description?: string
  total?: string
  taxes?: IdRef[]
}

export interface Comment {
  value: string
}

export interface Details {
  doc_type?: string
  service?: number
  export?: number
}

export interface Currency {
  currency_conversion_rate?: string
  currency_value?: number
}

export interface Transaction {
  title?: string
}

export interface TcsDetails {
  value?: number
}

/**
 * Full PO draft matching the backend PODraft Pydantic model.
 * Sent as `draft.model_dump(exclude_none=True)` from the backend.
 */
export interface PODraft {
  details: Details
  currency: Currency
  item_details: ItemDetails
  transaction: Transaction
  buyer_details: BuyerDetails
  supplier_details: SupplierDetails
  primary_document_details: PrimaryDocumentDetails
  gst_extra_charges?: GstExtraCharge[]
  amount_details: AmountDetails
  additional_document_details: AdditionalDocumentDetails
  comment?: Comment
  attach_signature?: boolean
  tcs_details?: TcsDetails
  save_action?: string
}
