import { createFileRoute, Navigate, redirect } from '@tanstack/react-router'

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
import { useChatStore } from '@/lib/store/chat-store'

export const Route = createFileRoute('/')({
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' })
    }
    // Prepare store for the incoming session (or reset for new chat)
    const store = useChatStore.getState()
    const sessionId = new URLSearchParams(location.searchStr).get('sessionId')
    if (!sessionId) {
      store.reset()
    } else if (store.sessionId !== sessionId) {
      store.reset()
      store.setSessionId(sessionId)
    }
  },
  component: ChatPage,
})

function ChatPage() {
  const { sessionId, isError } = useSessionNavigation()

  if (sessionId && isError) {
    return <Navigate to="/" replace />
  }

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
