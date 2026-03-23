import { createFileRoute, redirect } from '@tanstack/react-router'

import AppSidebar from '@/components/AppSidebar'
import ChatContainer from '@/components/chat/ChatContainer'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useSessionNavigation } from '@/lib/hooks/useSessionNavigation'
import { useAuthStore } from '@/lib/store/auth-store'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    sessionId:
      typeof search.sessionId === 'string' && search.sessionId.length > 0
        ? search.sessionId
        : undefined,
  }),
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: ChatPage,
})

function ChatPage() {
  useSessionNavigation()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <span className="text-sm font-medium">TZ Agent</span>
        </header>
        <div className="flex-1 overflow-hidden">
          <ChatContainer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
