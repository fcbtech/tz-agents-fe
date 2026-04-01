import { apiClient } from '@/lib/api/axios'
import type {
  AddressOption,
  BankOption,
  CounterpartyOption,
  DocNumberOption,
  GeneralOption,
  ItemOption,
  PaymentTermsOption,
  StoreOption,
  TaxOption,
} from '@/lib/types/master-data'

export async function searchCounterparties(
  query: string,
  limit = 10,
): Promise<CounterpartyOption[]> {
  const { data } = await apiClient.get<{ data: CounterpartyOption[] }>(
    '/api/master/counterparties',
    { params: { q: query, limit } },
  )
  return data.data
}

export async function searchItems(
  query: string,
  limit = 10,
): Promise<ItemOption[]> {
  const { data } = await apiClient.get<{ data: ItemOption[] }>(
    '/api/master/items',
    {
      params: { q: query, limit },
    },
  )
  return data.data
}

export async function searchTaxes(limit = 10): Promise<TaxOption[]> {
  const { data } = await apiClient.get<{ data: TaxOption[] }>(
    '/api/master/taxes',
    {
      params: { limit },
    },
  )
  return data.data
}

export async function searchDocNumbers(
  storeId?: string,
  limit = 10,
): Promise<DocNumberOption[]> {
  const { data } = await apiClient.get<{ data: DocNumberOption[] }>(
    '/api/master/doc-numbers',
    { params: { limit, ...(storeId ? { store_id: storeId } : {}) } },
  )
  return data.data
}

export async function searchPaymentTerms(
  query: string,
  limit = 10,
): Promise<PaymentTermsOption[]> {
  const { data } = await apiClient.get<{ data: PaymentTermsOption[] }>(
    '/api/master/payment-terms',
    { params: { q: query, limit } },
  )
  return data.data
}

export async function searchStores(
  query: string,
  limit = 10,
): Promise<StoreOption[]> {
  const { data } = await apiClient.get<{ data: StoreOption[] }>(
    '/api/master/stores',
    {
      params: { q: query, limit },
    },
  )
  return data.data
}

export async function searchBillingAddresses(
  storeId?: string,
  limit = 10,
): Promise<AddressOption[]> {
  const { data } = await apiClient.get<{ data: AddressOption[] }>(
    '/api/master/billing-addresses',
    { params: { limit, ...(storeId ? { store_id: storeId } : {}) } },
  )
  return data.data
}

export async function searchDeliveryLocations(
  storeId?: string,
  limit = 10,
): Promise<AddressOption[]> {
  const { data } = await apiClient.get<{ data: AddressOption[] }>(
    '/api/master/delivery-locations',
    { params: { limit, ...(storeId ? { store_id: storeId } : {}) } },
  )
  return data.data
}

export async function searchSupplierAddresses(
  companyId: string,
  storeId?: string,
  limit = 10,
): Promise<AddressOption[]> {
  const { data } = await apiClient.get<{ data: AddressOption[] }>(
    '/api/master/supplier-addresses',
    {
      params: {
        company_id: companyId,
        limit,
        ...(storeId ? { store_id: storeId } : {}),
      },
    },
  )
  return data.data
}

export async function searchBanks(limit = 10): Promise<BankOption[]> {
  const { data } = await apiClient.get<{ data: BankOption[] }>(
    '/api/master/banks',
    {
      params: { limit },
    },
  )
  return data.data
}

export async function searchLogistics(limit = 10): Promise<GeneralOption[]> {
  const { data } = await apiClient.get<{ data: GeneralOption[] }>(
    '/api/master/logistics',
    { params: { limit } },
  )
  return data.data
}

export async function searchTermsAndConditions(
  limit = 10,
): Promise<GeneralOption[]> {
  const { data } = await apiClient.get<{ data: GeneralOption[] }>(
    '/api/master/terms-and-conditions',
    { params: { limit } },
  )
  return data.data
}
