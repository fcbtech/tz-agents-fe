import {
  useState,
  useEffect,
  useRef,
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
import { useMentionSearch } from '@/lib/hooks/useMentionSearch'
import type {
  MasterDataCategory,
  MasterDataEntityType,
  MasterDataRow,
} from '@/lib/types/master-data'

const CATEGORIES: MasterDataCategory[] = [
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
  const [selectedCategory, setSelectedCategory] =
    useState<MasterDataEntityType | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const { results, loading } = useMentionSearch(selectedCategory, searchQuery)

  const filteredCategories = categoryFilter
    ? CATEGORIES.filter((cat) =>
        cat.label.toLowerCase().includes(categoryFilter.toLowerCase()),
      )
    : CATEGORIES

  const selectCategory = (type: MasterDataEntityType) => {
    setSelectedCategory(type)
    setPhase('search')
    setSearchQuery('')
    setCategoryFilter('')
    setSelectedIndex(0)
  }

  const selectItem = useCallback(
    (item: MasterDataRow) => {
      props.command({
        id: item.id,
        label: item.name,
        category: selectedCategory,
        metadata: item,
      })
    },
    [props, selectedCategory],
  )

  // Keyboard navigation — must return true to prevent Tiptap from
  // processing the key as editor input (which would type into the chat box).
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'Escape') return false // let Tiptap close the popup

      const items = phase === 'categories' ? filteredCategories : results

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
          if (filteredCategories[selectedIndex]) {
            selectCategory(filteredCategories[selectedIndex].type)
          }
        } else if (results[selectedIndex]) {
          selectItem(results[selectedIndex])
        }
        return true
      }
      if (event.key === 'Backspace') {
        if (phase === 'categories') {
          setCategoryFilter((prev) => prev.slice(0, -1))
        } else if (!searchQuery) {
          setPhase('categories')
          setSelectedCategory(null)
          setSelectedIndex(0)
        } else {
          setSearchQuery((prev) => prev.slice(0, -1))
        }
        return true
      }

      // Forward printable characters to the active filter/search state
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        if (phase === 'categories') {
          setCategoryFilter((prev) => prev + event.key)
          setSelectedIndex(0)
        } else {
          setSearchQuery((prev) => prev + event.key)
        }
        return true
      }

      // Block all other keys from reaching the editor
      return true
    },
  }))

  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedIndex(0)
  }, [results, filteredCategories])

  // Scroll selected item into view
  useEffect(() => {
    const container = listRef.current
    if (!container) return
    const el = container.querySelector(`[data-index="${selectedIndex}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

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
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Search size={14} />
            <Input
              type="text"
              value={categoryFilter}
              readOnly
              placeholder="Filter categories..."
              className="h-8 border-0 shadow-none focus-visible:ring-0 text-sm text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>
        <Separator />
        <CardContent className="p-0" ref={listRef}>
          <ScrollArea className="[&_[data-slot=scroll-area-viewport]]:max-h-60">
            {filteredCategories.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                No categories found
              </div>
            )}
            {filteredCategories.map((cat, i) => {
              const Icon = cat.icon
              return (
                <Button
                  key={cat.type}
                  data-index={i}
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
          </ScrollArea>
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
            readOnly
            placeholder="Search..."
            className="h-8 border-0 shadow-none focus-visible:ring-0 text-sm text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>
      <Separator />

      <CardContent className="p-0" ref={listRef}>
        <ScrollArea className="[&_[data-slot=scroll-area-viewport]]:max-h-48">
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
                data-index={i}
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
