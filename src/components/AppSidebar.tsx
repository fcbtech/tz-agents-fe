import { useNavigate } from '@tanstack/react-router'
import {
  MessageSquare,
  Plus,
  Settings,
  CreditCard,
  LogOut,
  ChevronsUpDown,
} from 'lucide-react'

import { useAuthStore } from '@/lib/store/auth-store'
import { useChatStore } from '@/lib/store/chat-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

function getUserInfo(email: string | null): {
  email: string
  name: string
  initials: string
} {
  if (!email) return { email: '', name: 'User', initials: 'U' }
  const name = email.split('@')[0] ?? 'User'
  const initials = name
    .split(/[._-]/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return { email, name, initials: initials || 'U' }
}

const dummyChats = [
  { id: '1', title: 'PO for Steel Rods - Tata Steel', date: 'Today' },
  { id: '2', title: 'Aluminium Sheets Order', date: 'Today' },
  { id: '3', title: 'Copper Wire Purchase', date: 'Yesterday' },
  { id: '4', title: 'PO for Packaging Material', date: 'Yesterday' },
  { id: '5', title: 'Bolt & Nut Order - Sundram', date: 'Last 7 days' },
  { id: '6', title: 'Raw Material Indent - March', date: 'Last 7 days' },
  { id: '7', title: 'Chemical Supplies PO', date: 'Last 7 days' },
  { id: '8', title: 'Electrical Components Order', date: 'Last 30 days' },
  { id: '9', title: 'Paint & Coating Supplies', date: 'Last 30 days' },
]

const chatGroups = [
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 30 days',
] as const

export default function AppSidebar() {
  const navigate = useNavigate()
  const userEmail = useAuthStore((s) => s.userEmail)
  const logout = useAuthStore((s) => s.logout)
  const resetChat = useChatStore((s) => s.reset)
  const user = getUserInfo(userEmail)

  const handleNewChat = () => {
    resetChat()
    navigate({ to: '/' })
  }

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-3">
        <Button
          onClick={handleNewChat}
          className="w-full gap-2"
          variant="outline"
        >
          <Plus className="size-4" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {chatGroups.map((group) => {
          const chats = dummyChats.filter((c) => c.date === group)
          if (chats.length === 0) return null
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {chats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton asChild>
                        <button className="w-full">
                          <MessageSquare className="size-4" />
                          <span className="truncate">{chat.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 size-4" />
                  Pricing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
