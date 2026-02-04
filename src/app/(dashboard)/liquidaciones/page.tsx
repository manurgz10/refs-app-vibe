import { HistoricoLiquidacionesClient } from "@/app/(dashboard)/liquidaciones/historico-liquidaciones-client";
import { auth } from "@/lib/auth";
import { getLiquidaciones } from "@/lib/services/liquidaciones";
import { getPaymentsNotPending } from "@/lib/services/payments-not-pending";
import { getPreliquidationWeekly } from "@/lib/services/preliquidation-weekly";
import type { Liquidacion } from "@/lib/types";
import type { PaymentNotPending } from "@/lib/types";
import type { PreliquidationWeeklyItem } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function formatEuro(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPeriod(initial: string, final: string) {
  const a = new Date(initial);
  const b = new Date(final);
  return `${a.toLocaleDateString("es-ES", { month: "short", year: "numeric" })} – ${b.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`;
}

/** Liquidación semanal */
function WeeklySection({ items }: { items: PreliquidationWeeklyItem[] }) {
  const totalNet = items.reduce((sum, i) => sum + i.netAmount, 0);
  const totalGross = items.reduce((sum, i) => sum + i.grossAmount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Liquidación semanal</CardTitle>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums">{formatEuro(totalNet)}</p>
          <CardDescription>Neto · Bruto {formatEuro(totalGross)}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.liquidationId} className="flex flex-col gap-1.5 py-4 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">
                  {[item.localTeamName, item.visitorTeamName].filter(Boolean).join(" – ") || "Partido"}
                </p>
                {item.categoryName && (
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {item.categoryName}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.formattedMatchDate ?? formatFecha(item.matchDate)}
                {item.conceptLiteral ? ` · ${item.conceptLiteral}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-xs">
                <span className="tabular-nums font-medium text-foreground">
                  Neto {formatEuro(item.netAmount)}
                </span>
                <span className="text-muted-foreground">
                  Bruto {formatEuro(item.grossAmount)}
                </span>
                {item.irpfRetentionAmount != null && item.irpfRetentionAmount > 0 && (
                  <span className="text-muted-foreground">
                    IRPF −{formatEuro(item.irpfRetentionAmount)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Vista con API real */
function ApiView({
  weekly,
  historico,
}: {
  weekly: PreliquidationWeeklyItem[];
  historico: PaymentNotPending[];
}) {
  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="page-title">Liquidaciones</h1>
      {weekly.length > 0 && (
        <section>
          <WeeklySection items={weekly} />
        </section>
      )}
      <section>
        <HistoricoLiquidacionesClient payments={historico} />
      </section>
    </div>
  );
}

/** Vista fallback (mock) */
function FallbackView({ liquidaciones }: { liquidaciones: Liquidacion[] }) {
  const total = liquidaciones.reduce((sum, l) => sum + l.importe, 0);

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="page-title">Liquidaciones</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Total</CardTitle>
          <p className="text-lg font-semibold tabular-nums">{formatEuro(total)}</p>
        </CardHeader>
        <CardContent>
          {liquidaciones.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay liquidaciones.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidaciones.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.concepto}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFecha(l.fecha)}
                      {l.partidoNombre ? ` · ${l.partidoNombre}` : ""}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEuro(l.importe)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.estado === "pagado" ? "secondary" : "warning"}>
                        {l.estado === "pagado" ? "Pagado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function LiquidacionesPage() {
  const session = await auth();
  const accessToken = (session as { accessToken?: string })?.accessToken;

  const useRealApi =
    accessToken &&
    process.env.EXTERNAL_API_URL &&
    process.env.USE_MOCK_API !== "true";

  if (useRealApi) {
    try {
      const [weekly, historico] = await Promise.all([
        getPreliquidationWeekly(accessToken!),
        getPaymentsNotPending(accessToken!),
      ]);
      const historicoRecientePrimero = [...historico].sort(
        (a, b) => new Date(b.finalControlDate).getTime() - new Date(a.finalControlDate).getTime()
      );
      return <ApiView weekly={weekly} historico={historicoRecientePrimero} />;
    } catch {
      // Fallback
    }
  }

  const liquidaciones = await getLiquidaciones(accessToken);
  return <FallbackView liquidaciones={liquidaciones} />;
}
