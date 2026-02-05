import Image from "next/image";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex min-h-14 shrink-0 items-center justify-center border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-card/95 md:px-6 md:pt-0">
        <Image
          src="/logo1.png"
          alt="Árbitros"
          width={280}
          height={64}
          className="h-11 w-auto md:h-12"
          priority
        />
      </header>
      <div className="flex-1 overflow-auto p-4 pb-24 md:pb-6 md:pt-6 [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto max-w-3xl">
          {children}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
