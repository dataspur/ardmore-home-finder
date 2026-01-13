import { LayoutDashboard, Users, FileText, CreditCard, LogOut, MessageSquare, Building2, Settings } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import { useAdminUnreadCounts } from "@/hooks/useAdminUnreadCounts";

// Admin navigation items
const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Tenants", url: "/admin/tenants", icon: Users },
  { title: "Properties", url: "/admin/properties", icon: Building2 },
  { title: "Leases", url: "/admin/leases", icon: FileText },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const { data: unreadCounts } = useAdminUnreadCounts();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 border-b">
        <img src={logo} alt="Precision Capital" className="h-8" />
        <p className="text-xs text-muted-foreground mt-1">Admin Dashboard</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.title === "Messages" && unreadCounts && unreadCounts.total > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center">
                          {unreadCounts.total}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
