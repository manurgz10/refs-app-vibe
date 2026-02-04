"use client";

import type { PaymentNotPending } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      className="flex w-full min-w-full shrink-0 flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 snap-start"
      style={{ scrollSnapStop: "always" }}
    >
      <p className="font-medium text-foreground">{period}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Bruto</span>
        <span className="tabular-nums text-right">
          {formatEuro(p.grosAmount)}
          {p.amountHoldingIRPF > 0 && (
            <span className="block text-xs text-muted-foreground">IRPF −{formatEuro(p.amountHoldingIRPF)}</span>
          )}
        </span>
        <span className="text-muted-foreground">Neto</span>
        <span className="tabular-nums text-right font-medium">{formatEuro(p.netAmount)}</span>
        <span className="text-muted-foreground">A cobrar</span>
        <span className="tabular-nums text-right font-semibold text-primary">{formatEuro(p.toPayAmount)}</span>
      </div>
    </div>
  );
}

export function HistoricoLiquidacionesClient({ payments }: { payments: PaymentNotPending[] }) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de liquidaciones</CardTitle>
          <CardDescription>Pagos ya procesados por período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8">
            <div className="mx-auto flex max-w-[80px] justify-center text-muted-foreground/40">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-full" aria-hidden>
                <rect x="4" y="8" width="40" height="32" rx="2" />
                <path d="M4 20h40M16 8v8M32 8v8" />
              </svg>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No hay historial de pagos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de liquidaciones</CardTitle>
        <CardDescription>Pagos ya procesados por período</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="-mx-1 flex overflow-x-auto overflow-y-hidden pb-1 scroll-smooth md:-mx-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {payments.map((p) => (
            <HistoricoPaymentCard key={p.idPayment} p={p} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
