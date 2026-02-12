"use client";

import { useRef } from "react";
import type { PaymentNotPending } from "@/lib/types";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Banknote } from "lucide-react";

function formatEuro(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPeriod(initial: string, final: string) {
  const a = new Date(initial);
  const b = new Date(final);
  return `${a.toLocaleDateString("es-ES", { month: "short", year: "numeric" })} – ${b.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`;
}

function HistoricoPaymentCard({ p }: { p: PaymentNotPending }) {
  const period = formatPeriod(p.initialControlDate, p.finalControlDate);
  return (
    <div
      className="flex w-full min-w-full max-w-full shrink-0 flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm snap-start md:w-[calc(50%-0.5rem)] md:min-w-[calc(50%-0.5rem)]"
      style={{ scrollSnapStop: "always" }}
    >
      <Badge variant="outline" className="w-fit text-xs font-medium">
        {period}
      </Badge>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Bruto</span>
          <span className="tabular-nums font-medium">{formatEuro(p.grosAmount)}</span>
        </div>
        {p.amountHoldingIRPF > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">IRPF</span>
            <span className="tabular-nums text-amber-600 dark:text-amber-400">
              −{formatEuro(p.amountHoldingIRPF)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Neto</span>
          <span className="tabular-nums font-medium">{formatEuro(p.netAmount)}</span>
        </div>
      </div>
      <div className="mt-auto rounded-lg bg-emerald-500/10 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Banknote className="size-3.5" aria-hidden />
            A cobrar
          </span>
          <span className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatEuro(p.toPayAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function HistoricoLiquidacionesClient({ payments }: { payments: PaymentNotPending[] }) {
  const lastXRef = useRef<number | null>(null);
  if (payments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex h-8 items-center gap-2">
          <History className="size-5 text-muted-foreground" aria-hidden />
          <CardTitle className="text-base">Histórico de liquidaciones</CardTitle>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <History className="size-8 text-muted-foreground/60" aria-hidden />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No hay historial de pagos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-8 items-center gap-2">
        <History className="size-5 text-muted-foreground" aria-hidden />
        <CardTitle className="text-base">Histórico de liquidaciones</CardTitle>
      </div>
      <div
        className="no-scrollbar flex w-full max-w-full gap-4 overflow-x-auto overflow-y-hidden pb-1 scroll-smooth"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseEnter={(event) => {
          lastXRef.current = event.clientX;
        }}
        onMouseLeave={() => {
          lastXRef.current = null;
        }}
        onMouseMove={(event) => {
          if (lastXRef.current == null) {
            lastXRef.current = event.clientX;
            return;
          }
          const delta = event.clientX - lastXRef.current;
          if (delta !== 0) {
            event.currentTarget.scrollLeft -= delta;
          }
          lastXRef.current = event.clientX;
        }}
        onWheel={(event) => {
          if (event.deltaY === 0) return;
          event.currentTarget.scrollLeft += event.deltaY;
        }}
      >
        {payments.map((p) => (
          <HistoricoPaymentCard key={p.idPayment} p={p} />
        ))}
      </div>
    </div>
  );
}
