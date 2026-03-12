import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react'
import {
  Building,
  Package,
  FileText,
  MapPin,
  Search,
  Receipt,
  Hash,
  CreditCard,
  Warehouse,
  MapPinned,
  Landmark,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useMentionSearch } from '@/hooks/useMentionSearch'
import type { MasterDataCategory } from '@/types/master-data'
import type { LucideIcon } from 'lucide-react'

const CATEGORIES: Array<MasterDataCategory & { icon: LucideIcon }> = [
  { type: 'counterparty', label: 'Counterparties', icon: Building },
  { type: 'item', label: 'Items', icon: Package },
  { type: 'tax', label: 'Tax', icon: Receipt },
  { type: 'doc_number', label: 'Document Numbers', icon: Hash },
  { type: 'payment_terms', label: 'Payment Terms', icon: CreditCard },
  { type: 'store', label: 'Stores', icon: Warehouse },
  { type: 'billing_address', label: 'Billing Addresses', icon: MapPin },
  { type: 'delivery_location', label: 'Delivery Locations', icon: MapPinned },
  { type: 'supplier_address', label: 'Supplier Addresses', icon: MapPin },
  { type: 'bank', label: 'Banks', icon: Landmark },
  { type: 'logistics', label: 'Logistics', icon: Truck },
  { type: 'terms_and_conditions', label: 'Terms & Conditions', icon: FileText },
]

interface Props {
  command: (attrs: Record<string, unknown>) => void
}

const MentionDropdown = forwardRef((props: Props, ref) => {
  const [phase, setPhase] = useState<'categories' | 'search'>('categories')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const { results, loading } = useMentionSearch(selectedCategory, searchQuery)

  const selectCategory = (type: string) => {
    setSelectedCategory(type)
    setPhase('search')
    setSearchQuery('')
    setSelectedIndex(0)
  }

  const selectItem = useCallback(
    (item: { id: string; name: string; [key: string]: unknown }) => {
      props.command({
        id: item.id,
        label: item.name,
        category: selectedCategory,
        metadata: item,
      })
    },
    [props, selectedCategory],
  )

  // Keyboard navigation
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      const items = phase === 'categories' ? CATEGORIES : results
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i > 0 ? i - 1 : items.length - 1))
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i < items.length - 1 ? i + 1 : 0))
        return true
      }
      if (event.key === 'Enter') {
        if (phase === 'categories') {
          selectCategory(CATEGORIES[selectedIndex].type)
        } else if (results[selectedIndex]) {
          selectItem(results[selectedIndex])
        }
        return true
      }
      if (event.key === 'Backspace' && phase === 'search' && !searchQuery) {
        setPhase('categories')
        setSelectedCategory(null)
        setSelectedIndex(0)
        return true
      }
      return false
    },
  }))

  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Phase 1: Category selection
  if (phase === 'categories') {
    return (
      <Card className="w-64 gap-0 py-0 shadow-lg overflow-hidden">
        <CardHeader className="px-3 py-2">
          <CardTitle className="text-xs font-semibold text-gray-500 uppercase">
            Select Category
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon
            return (
              <Button
                key={cat.type}
                variant="ghost"
                onClick={() => selectCategory(cat.type)}
                className={`w-full justify-start h-auto px-3 py-2.5 text-sm rounded-none
                  ${i === selectedIndex ? 'bg-blue-50 text-blue-800' : 'text-gray-700'}`}
              >
                <Icon size={16} className="text-gray-400" />
                {cat.label}
              </Button>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  // Phase 2: Search within category
  const categoryLabel =
    CATEGORIES.find((c) => c.type === selectedCategory)?.label ?? ''

  return (
    <Card className="w-72 gap-0 py-0 shadow-lg overflow-hidden">
      <CardHeader className="px-3 py-2 flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold text-gray-500 uppercase">
          {categoryLabel}
        </CardTitle>
        <Button
          variant="link"
          size="xs"
          onClick={() => {
            setPhase('categories')
            setSelectedCategory(null)
          }}
          className="text-blue-500 text-xs p-0 h-auto"
        >
          Back
        </Button>
      </CardHeader>
      <Separator />

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 text-gray-400">
          <Search size={14} />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1))
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (results[selectedIndex]) selectItem(results[selectedIndex])
              } else if (e.key === 'Backspace' && !searchQuery) {
                setPhase('categories')
                setSelectedCategory(null)
                setSelectedIndex(0)
              }
            }}
            placeholder="Search..."
            className="h-8 border-0 shadow-none focus-visible:ring-0 text-sm text-gray-700 placeholder:text-gray-400"
            autoFocus
          />
        </div>
      </div>
      <Separator />

      <CardContent className="p-0">
        <ScrollArea className="max-h-48">
          {loading && (
            <div className="px-3 py-4 text-center text-sm text-gray-400">
              Loading...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-gray-400">
              No results found
            </div>
          )}
          {!loading &&
            results.map((item, i) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => selectItem(item)}
                className={`w-full justify-start h-auto px-3 py-2 text-sm rounded-none
                  ${i === selectedIndex ? 'bg-blue-50 text-blue-800' : 'text-gray-700'}`}
              >
                {item.name}
              </Button>
            ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
})

MentionDropdown.displayName = 'MentionDropdown'
export default MentionDropdown
