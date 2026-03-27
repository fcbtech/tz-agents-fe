import { useLocation, useNavigate } from '@tanstack/react-router'
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

export default function SessionList() {
  const navigate = useNavigate({ from: '/' })
  const activeSessionId = useLocation({
    select: (location) => {
      const sessionId = new URLSearchParams(location.searchStr).get('sessionId')
      return sessionId && sessionId.length > 0 ? sessionId : undefined
    },
  })
  const isStreaming = useChatStore((s) => s.isStreaming)
  const { data, isLoading } = useSessionList()

  const handleSessionClick = (id: string) => {
    if (isStreaming) return
    navigate({ to: '/', search: { sessionId: id } })
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <SidebarMenu>
          {Array.from({ length: 3 }, (_, index) => (
            <SidebarMenuItem key={index}>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="size-4 shrink-0 rounded" />
                <Skeleton className="h-4 flex-1 rounded" />
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )
    }

    if (!data?.sessions.length) {
      return (
        <p className="text-muted-foreground px-2 text-sm">No previous chats</p>
      )
    }

    return (
      <SidebarMenu>
        {data.sessions.map((chat) => {
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
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarGroupContent>{renderContent()}</SidebarGroupContent>
    </SidebarGroup>
  )
}
