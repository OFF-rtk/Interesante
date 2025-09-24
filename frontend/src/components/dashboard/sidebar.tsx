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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
  } from "@/components/ui/sidebar";
  import { Shield, Home, Upload, FileText, Search, Settings, User, CreditCard, HelpCircle } from "lucide-react";
  import Link from "next/link";
  import { usePathname } from "next/navigation";
  
  const navigation = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
        },
      ],
    },
    {
      title: "Content Protection",
      items: [
        {
          title: "Upload & Analyze",
          url: "/analyze",
          icon: Upload,
        },
        {
          title: "Certificates",
          url: "/certificates",
          icon: FileText,
        },
        {
          title: "Similarity Reports",
          url: "/similarity",
          icon: Search,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
          items: [
            {
              title: "Profile",
              url: "/settings/profile",
            },
            {
              title: "Billing",
              url: "/settings/billing",
            },
          ],
        },
        {
          title: "Help & Support",
          url: "/help",
          icon: HelpCircle,
        },
      ],
    },
  ];
  
  export function AppSidebar() {
    const pathname = usePathname();
  
    return (
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Copyright Shield</span>
          </Link>
        </SidebarHeader>
        
        <SidebarContent>
          {navigation.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      
                      {item.items && (
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/settings/profile">
                  <User className="h-4 w-4" />
                  <span>Account</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    );
  }
  