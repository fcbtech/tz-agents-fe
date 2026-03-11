import { createFileRoute, redirect } from '@tanstack/react-router'
import ChatContainer from '@/components/chat/ChatContainer'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: ChatPage,
})

function ChatPage() {
  return <ChatContainer />
}
