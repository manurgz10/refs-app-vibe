import Image from "next/image";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-card">
        <header className="flex min-h-14 shrink-0 items-center justify-center gap-2 border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)] md:justify-start md:px-6 md:pt-0">
          <SidebarTrigger className="-ml-1 hidden md:flex" aria-label="Abrir menú" />
          <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
          <Image
            src="/logo1.png"
            alt="Árbitros"
            width={320}
            height={80}
            className="h-14 w-auto md:h-16"
            priority
          />
        </header>
        <div className="flex-1 overflow-auto p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6 md:pt-6 [-webkit-overflow-scrolling:touch]">
          <div className="mx-auto max-w-3xl">
            {children}
          </div>
        </div>
      </SidebarInset>
      <MobileBottomNav />
    </SidebarProvider>
  );
}
