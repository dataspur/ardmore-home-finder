import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminChatWidget } from "./AdminChatWidget";

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b flex items-center px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <span className="ml-4 font-semibold text-lg">Control Tower</span>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
        <AdminChatWidget />
      </div>
    </SidebarProvider>
  );
}
