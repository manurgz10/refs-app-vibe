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
import { Separator } from "@/components/ui/separator";
import { Wallet, CalendarDays, Receipt, Trophy } from "lucide-react";

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

const MAX_TEAM_NAME_CHARS = 32;

function truncateTeamName(name: string | null | undefined): string {
  if (!name || !name.trim()) return "";
  const t = name.trim();
  return t.length > MAX_TEAM_NAME_CHARS ? t.slice(0, MAX_TEAM_NAME_CHARS) + "…" : t;
}

function MatchTeamsDisplay({
  local,
  visitor,
}: {
  local: string | null | undefined;
  visitor: string | null | undefined;
}) {
  const localStr = truncateTeamName(local);
  const visitorStr = truncateTeamName(visitor);
  const title = [local, visitor].filter(Boolean).join(" – ") || undefined;
  return (
    <div
      className="flex min-w-0 flex-col gap-0.5 overflow-hidden text-sm"
      title={title}
    >
      {localStr ? (
        <span className="min-w-0 truncate text-foreground">{localStr}</span>
      ) : null}
      {visitorStr ? (
        <span className="min-w-0 truncate text-muted-foreground">{visitorStr}</span>
      ) : null}
      {!localStr && !visitorStr ? (
        <span className="text-muted-foreground">Partido</span>
      ) : null}
    </div>
  );
}

/** Resumen destacado de la semana */
function WeeklySummaryCard({ totalNet, totalGross }: { totalNet: number; totalGross: number }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-row items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
            <Wallet className="size-6 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total pendiente esta semana</p>
            <p className="text-2xl font-bold tabular-nums text-primary">{formatEuro(totalNet)}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          Bruto {formatEuro(totalGross)}
        </Badge>
      </CardContent>
    </Card>
  );
}

/** Liquidación semanal: lista de partidos con desglose claro */
function WeeklySection({ items }: { items: PreliquidationWeeklyItem[] }) {
  const totalNet = items.reduce((sum, i) => sum + i.netAmount, 0);
  const totalGross = items.reduce((sum, i) => sum + i.grossAmount, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-5 text-muted-foreground" aria-hidden />
        <h2 className="text-lg font-semibold">Esta semana</h2>
        <Badge variant="outline" className="text-xs">
          {items.length} partido{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      <WeeklySummaryCard totalNet={totalNet} totalGross={totalGross} />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-4" aria-hidden />
            Desglose por partido
          </CardTitle>
          <CardDescription>Bruto y neto de cada designación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {items.map((item, index) => (
              <div key={item.liquidationId}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <MatchTeamsDisplay local={item.localTeamName} visitor={item.visitorTeamName} />
                    {item.categoryName && (
                      <Badge variant="secondary" className="border-border bg-white text-xs font-normal text-foreground">
                        <Trophy className="mr-1 size-3" aria-hidden />
                        {item.categoryName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.formattedMatchDate ?? formatFecha(item.matchDate)}
                    {item.conceptLiteral ? ` · ${item.conceptLiteral}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium tabular-nums">
                      Bruto {formatEuro(item.grossAmount)}
                    </Badge>
                    <Badge variant="success" className="px-3 py-1.5 text-sm font-semibold tabular-nums">
                      Neto {formatEuro(item.netAmount)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
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
    <div className="space-y-8">
      {weekly.length > 0 && <WeeklySection items={weekly} />}
      <section className="space-y-4">
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
