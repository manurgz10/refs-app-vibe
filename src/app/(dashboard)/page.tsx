import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getDesignationsStatus } from "@/lib/services/designations-status";
import { getMyMatches } from "@/lib/services/my-matches";
import { getMatchDetail } from "@/lib/services/match-detail";
import { getPartidos } from "@/lib/services/partidos";
import type { Partido } from "@/lib/types";
import type { DesignationsStatus, MyMatchDesignation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Countdown } from "@/components/countdown";
import { getGoogleMapsDirectionsUrl } from "@/lib/utils";
import { CalendarDays, MapPin, Trophy } from "lucide-react";

const MAX_LOCATION_CHARS = 32;

/** Ilustración SVG para estados vacíos (balón/árbitro) */
function EmptyMatchesIllustration() {
  return (
    <div className="mx-auto flex max-w-[120px] justify-center py-6 text-muted-foreground/50">
      <svg viewBox="0 0 64 64" fill="none" className="size-full" aria-hidden>
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" />
        <path d="M32 12v40M12 32h40" stroke="currentColor" strokeWidth="2" />
        <path d="M18 18l28 28M46 18L18 46" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function formatFecha(fecha: string, hora: string) {
  const d = new Date(fecha + "T" + (hora || "00:00"));
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Card "Próximo partido" con logos (si hay), categoría, horario, lugar y countdown. API. */
function NextMatchCard({
  m,
  localLogo,
  visitorLogo,
}: {
  m: MyMatchDesignation;
  localLogo?: string | null;
  visitorLogo?: string | null;
}) {
  const placeFull = [m.installationName, m.town].filter(Boolean).join(", ") || (m.installationAddress ?? "");
  const placeForMaps = m.installationAddress?.trim() || placeFull;
  const placeDisplay = placeFull.length > MAX_LOCATION_CHARS ? placeFull.slice(0, MAX_LOCATION_CHARS) + "..." : placeFull;
  const horario = m.formattedMatchDay ?? (m.matchDay ? new Date(m.matchDay).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <Link href={`/partidos/${m.matchId}`} className="block transition-opacity hover:opacity-95">
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                {localLogo ? (
                  <Image src={localLogo} alt="" width={48} height={48} className="size-12 rounded-full object-contain" />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted" />
                )}
                <span className="max-w-[100px] truncate text-center text-xs font-medium text-muted-foreground sm:max-w-[120px]">
                  {m.localTeamName}
                </span>
              </div>
              <span className="text-muted-foreground">–</span>
              <div className="flex flex-col items-center gap-1">
                {visitorLogo ? (
                  <Image src={visitorLogo} alt="" width={48} height={48} className="size-12 rounded-full object-contain" />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted" />
                )}
                <span className="max-w-[100px] truncate text-center text-xs font-medium text-muted-foreground sm:max-w-[120px]">
                  {m.visitorTeamName}
                </span>
              </div>
            </div>
          </Link>
          {m.categoryName && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-xs">
                <Trophy className="mr-1 size-3" aria-hidden />
                {m.categoryName}
              </Badge>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden />
              {horario}
            </span>
            {placeFull && placeForMaps && (
              <a
                href={getGoogleMapsDirectionsUrl(placeForMaps)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
                title={placeFull}
              >
                <MapPin className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{placeDisplay}</span>
              </a>
            )}
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center text-sm">
            <span className="text-muted-foreground">Faltan </span>
            <Countdown dateIso={m.matchDay} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Card "Próximo partido" para datos mock (sin logos). */
function NextMatchCardMock({ p }: { p: Partido }) {
  const horario = formatFecha(p.fecha, p.hora);
  const dateIso = p.fecha + "T" + (p.hora || "00:00");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <Link href={`/partidos/${p.id}`} className="block transition-opacity hover:opacity-95">
            <div className="flex items-center justify-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted" />
              <span className="max-w-[120px] truncate text-center text-sm font-medium text-foreground">
                {p.equipoLocal}
              </span>
              <span className="text-muted-foreground">–</span>
              <div className="flex size-12 items-center justify-center rounded-full bg-muted" />
              <span className="max-w-[120px] truncate text-center text-sm font-medium text-foreground">
                {p.equipoVisitante}
              </span>
            </div>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden />
              {horario}
            </span>
            {p.lugar && (
              <a
                href={getGoogleMapsDirectionsUrl(p.lugar)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <MapPin className="size-4" aria-hidden />
                {p.lugar}
              </a>
            )}
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center text-sm">
            <span className="text-muted-foreground">Faltan </span>
            <Countdown dateIso={dateIso} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const accessToken = (session as { accessToken?: string })?.accessToken;

  const useRealApi = accessToken && process.env.EXTERNAL_API_URL && process.env.USE_MOCK_API !== "true";
  let myMatches: MyMatchDesignation[] = [];
  let designationsStatus: DesignationsStatus | null = null;
  if (useRealApi) {
    try {
      const [matches, status] = await Promise.all([
        getMyMatches(accessToken!),
        getDesignationsStatus(accessToken!),
      ]);
      myMatches = matches;
      designationsStatus = status;
    } catch {
      // Fallback a getPartidos
    }
  }

  const partidos = myMatches.length > 0 ? [] : await getPartidos(accessToken);
  const pendientes = partidos.filter((p) => p.estado === "pendiente");

  // Próximo partido: API → primer partido futuro de myMatches; Mock → primer pendiente
  let nextMatchApi: MyMatchDesignation | null = null;
  let nextMatchDetail: { localClubLogo?: string | null; visitorClubLogo?: string | null } | null = null;
  let nextMatchMock: Partido | null = null;

  if (myMatches.length > 0) {
    const now = Date.now();
    const sorted = [...myMatches].sort((a, b) => new Date(a.matchDay).getTime() - new Date(b.matchDay).getTime());
    nextMatchApi = sorted.find((m) => new Date(m.matchDay).getTime() >= now) ?? sorted[0] ?? null;
    if (nextMatchApi) {
      try {
        const detail = await getMatchDetail(String(nextMatchApi.matchId));
        const match = detail.messageData?.match;
        if (match) {
          nextMatchDetail = {
            localClubLogo: match.localClubLogo,
            visitorClubLogo: match.visitorClubLogo,
          };
        }
      } catch {
        // Sin logos
      }
    }
  } else if (pendientes.length > 0) {
    nextMatchMock = pendientes[0];
  }

  const hasNextMatch = nextMatchApi ?? nextMatchMock;

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="page-title">Inicio</h1>

      {/* Designaciones: solo si hay descargadas o pendientes. Ancho completo, texto completo, color propio. */}
      {designationsStatus !== null &&
        (designationsStatus.downloaded.length > 0 || designationsStatus.pending.length > 0) && (
          <section className="flex w-full flex-col gap-2">
            {designationsStatus.downloaded.length > 0 && (
              <Link
                href="/designaciones-descargadas"
                className="flex w-full items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15"
              >
                <span className="font-medium text-primary">Designaciones descargadas</span>
                <span className="text-lg font-bold tabular-nums text-primary">
                  {designationsStatus.downloaded.length}
                </span>
              </Link>
            )}
            {designationsStatus.pending.length > 0 && (
              <Link
                href="/designaciones-pendientes"
                className="flex w-full items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left transition-colors hover:bg-amber-500/15"
              >
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Designaciones pendientes
                </span>
                <span className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
                  {designationsStatus.pending.length}
                </span>
              </Link>
            )}
          </section>
        )}

      {/* Próximo partido: un solo partido con logos, categoría, horario, lugar y countdown */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Próximo partido</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/partidos">Ver todos</Link>
          </Button>
        </div>
        {nextMatchApi ? (
          <NextMatchCard
            m={nextMatchApi}
            localLogo={nextMatchDetail?.localClubLogo}
            visitorLogo={nextMatchDetail?.visitorClubLogo}
          />
        ) : nextMatchMock ? (
          <NextMatchCardMock p={nextMatchMock} />
        ) : (
          <Card>
            <CardContent className="py-10">
              <EmptyMatchesIllustration />
              <p className="text-center text-sm text-muted-foreground">No tienes próximo partido.</p>
              <Button variant="outline" size="sm" className="mx-auto mt-3 block" asChild>
                <Link href="/partidos">Ver partidos</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="pt-2">
        <Button variant="outline" className="w-full sm:w-auto" asChild>
          <Link href="/liquidaciones">Ver liquidaciones</Link>
        </Button>
      </section>
    </div>
  );
}
