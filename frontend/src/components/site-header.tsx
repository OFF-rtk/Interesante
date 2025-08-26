"use client";

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "./theme-toggle"
import { usePathname } from "next/navigation"

const routeTitleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/works': 'Works',
  '/billings': 'Billings',
}

// Function to get page title from pathname
function getPageTitle(pathname: string): string {
  // Check exact match first
  if (routeTitleMap[pathname]) {
    return routeTitleMap[pathname]
  }
  
  // For dynamic routes, try to get the last segment
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  
  // If it's a known route pattern, handle it
  if (segments.length > 1) {
    const parentRoute = `/${segments.slice(0, -1).join('/')}`
    if (routeTitleMap[parentRoute]) {
      return `${routeTitleMap[parentRoute]} / ${formatSegment(lastSegment)}`
    }
  }
  
  // Default: capitalize and format the last segment
  return formatSegment(lastSegment) || 'Dashboard'
}

// Helper function to format URL segments into readable titles
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function SiteHeader() {

  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
