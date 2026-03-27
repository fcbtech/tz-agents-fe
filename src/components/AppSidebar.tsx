import { useNavigate } from '@tanstack/react-router'
import {
  Plus,
  Settings,
  CreditCard,
  LogOut,
  ChevronsUpDown,
} from 'lucide-react'

import { useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/lib/store/auth-store'
import { useChatStore } from '@/lib/store/chat-store'
import { useProfile } from '@/lib/hooks/useProfile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import SessionList from '@/components/SessionList'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return initials || 'U'
}

export default function AppSidebar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userEmail = useAuthStore((s) => s.userEmail)
  const logout = useAuthStore((s) => s.logout)
  const resetChat = useChatStore((s) => s.reset)
  const { data: profile, isLoading } = useProfile()

  const emailPrefix = userEmail?.split('@')[0] ?? null
  const displayName = profile?.user.name ?? emailPrefix ?? 'User'
  const displayEmail = profile?.user.email ?? userEmail ?? ''
  const avatarUrl = profile?.user.avatar_url
  const initials = getInitials(displayName)

  const handleNewChat = () => {
    resetChat()
    navigate({ to: '/' })
  }

  const handleLogout = () => {
    queryClient.clear()
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
        <SessionList />
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
                    <AvatarImage
                      src={avatarUrl ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isLoading ? (
                    <div className="grid flex-1 gap-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ) : (
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {displayName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {displayEmail}
                      </span>
                    </div>
                  )}
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
                      <AvatarImage
                        src={avatarUrl ?? undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className="rounded-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {displayName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {displayEmail}
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
