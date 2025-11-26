import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/hooks/useAuth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const navMain = [
    {
      title: t('sidebar.dashboard'),
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: t('sidebar.lifecycle'),
      url: "/catalog",
      icon: ListIcon,
    },
    {
      title: t('sidebar.analytics'),
      url: "/dashboard",
      icon: BarChartIcon,
    },
    {
      title: t('sidebar.projects'),
      url: "/catalog",
      icon: FolderIcon,
    },
    {
      title: t('sidebar.team'),
      url: "/dashboard",
      icon: UsersIcon,
    },
  ]

  const navSecondary = [
    {
      title: t('sidebar.settings'),
      url: "/dashboard",
      icon: SettingsIcon,
    },
    {
      title: t('sidebar.get_help'),
      url: "/",
      icon: HelpCircleIcon,
    },
    {
      title: t('sidebar.search'),
      url: "/catalog",
      icon: SearchIcon,
    },
  ]

  const documents = [
    {
      name: t('sidebar.data_library'),
      url: "/dashboard",
      icon: DatabaseIcon,
    },
    {
      name: t('sidebar.reports'),
      url: "/dashboard",
      icon: ClipboardListIcon,
    },
    {
      name: t('sidebar.word_assistant'),
      url: "/dashboard",
      icon: FileIcon,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">{t('sidebar.company_name')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              name: user.name ?? user.username ?? user.email,
              email: user.email,
              avatar: user.avatar ?? "",
            }}
            onLogout={logout}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
