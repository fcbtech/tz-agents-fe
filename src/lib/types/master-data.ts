import type { LucideIcon } from 'lucide-react'

export type MasterDataEntityType =
  | 'counterparty'
  | 'item'
  | 'tax'
  | 'doc_number'
  | 'payment_terms'
  | 'store'
  | 'billing_address'
  | 'delivery_location'
  | 'supplier_address'
  | 'bank'
  | 'logistics'
  | 'terms_and_conditions'

export interface MasterDataCategory {
  type: MasterDataEntityType
  label: string
  icon: LucideIcon
}

export interface MasterDataBase {
  id: string
  name: string
}

export interface ItemUnit {
  id?: string
  unit_name?: string
  conversion_factor?: number
  base_unit?: boolean
}

export interface CounterpartyOption extends MasterDataBase {
  company_image?: string
  reference_id?: string
}

export interface ItemOption extends MasterDataBase {
  product_name?: string
  hsn_code?: string
  price?: number
  units?: ItemUnit[]
}

export interface TaxOption extends MasterDataBase {
  tax_percentage?: number
}

export interface DocNumberOption extends MasterDataBase {
  series_name?: string
}

export interface PaymentTermsOption extends MasterDataBase {
  description?: string
  payment_delta?: number
}

export interface StoreOption extends MasterDataBase {
  is_default?: boolean
  location?: string
}

export interface AddressOption extends MasterDataBase {
  address1?: string
  city?: string
  state?: string
  pin?: string
}

export interface BankOption extends MasterDataBase {
  account_holder_name?: string
  account_number?: string
  ifsc_code?: string
}

export interface GeneralOption extends MasterDataBase {
  description?: string
}

/** Normalized row from any master search — use for mention metadata. */
export type MasterDataRow =
  | CounterpartyOption
  | ItemOption
  | TaxOption
  | DocNumberOption
  | PaymentTermsOption
  | StoreOption
  | AddressOption
  | BankOption
  | GeneralOption
