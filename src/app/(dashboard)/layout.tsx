import Image from "next/image";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PullToRefresh } from "@/components/pull-to-refresh";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-center border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6">
        <Image
          src="/logo1.png"
          alt="Árbitros"
          width={280}
          height={64}
          className="h-11 w-auto md:h-12"
          priority
        />
      </header>
      <PullToRefresh className="flex-1 overflow-auto p-4 pb-24 md:pb-6 md:pt-6">
        <div className="mx-auto max-w-3xl">{children}</div>
      </PullToRefresh>
      <MobileBottomNav />
    </div>
  );
}
