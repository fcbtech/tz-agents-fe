import { useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionList } from '@/lib/hooks/useSessions'
import { useChatStore } from '@/lib/store/chat-store'
import type { SessionSummary } from '@/lib/types/session'

const GROUP_ORDER = [
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 30 days',
  'Older',
] as const

function getDateGroupLabel(iso: string | null | undefined): (typeof GROUP_ORDER)[number] {
  if (!iso) return 'Older'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Older'

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (day >= startOfToday) return 'Today'
  if (day >= startOfYesterday) return 'Yesterday'

  const weekAgo = new Date(startOfToday)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (day >= weekAgo) return 'Last 7 days'

  const monthAgo = new Date(startOfToday)
  monthAgo.setDate(monthAgo.getDate() - 30)
  if (day >= monthAgo) return 'Last 30 days'

  return 'Older'
}

function groupSessions(sessions: SessionSummary[]) {
  const map = new Map<string, SessionSummary[]>()
  for (const s of sessions) {
    const label = getDateGroupLabel(s.updated_at ?? s.created_at)
    const list = map.get(label) ?? []
    list.push(s)
    map.set(label, list)
  }
  return GROUP_ORDER.map((label) => ({
    label,
    items: map.get(label) ?? [],
  })).filter((g) => g.items.length > 0)
}

export default function SessionList() {
  const navigate = useNavigate({ from: '/' })
  const { sessionId: activeSessionId } = useSearch({ from: '/' })
  const isStreaming = useChatStore((s) => s.isStreaming)
  const { data, isLoading } = useSessionList()

  const grouped = useMemo(
    () => groupSessions(data?.sessions ?? []),
    [data?.sessions],
  )

  const handleSessionClick = (id: string) => {
    if (isStreaming) return
    navigate({ to: '/', search: { sessionId: id } })
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Recent</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {[0, 1, 2].map((i) => (
              <SidebarMenuItem key={i}>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Skeleton className="size-4 shrink-0 rounded" />
                  <Skeleton className="h-4 flex-1 rounded" />
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  if (!data?.sessions.length) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarGroupContent>
          <p className="text-muted-foreground px-2 text-sm">No previous chats</p>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <>
      {grouped.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((chat) => {
                const isActive = activeSessionId === chat.session_id
                return (
                  <SidebarMenuItem key={chat.session_id}>
                    <SidebarMenuButton
                      type="button"
                      isActive={isActive}
                      disabled={isStreaming}
                      aria-current={isActive ? 'page' : undefined}
                      className="w-full"
                      onClick={() => handleSessionClick(chat.session_id)}
                    >
                      <MessageSquare className="size-4" />
                      <span className="truncate">
                        {chat.title?.trim() || 'Untitled Chat'}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
