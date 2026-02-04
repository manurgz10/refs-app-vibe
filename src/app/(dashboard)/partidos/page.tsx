import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getMyMatches } from "@/lib/services/my-matches";
import { getMatchDetail } from "@/lib/services/match-detail";
import { getPartidos } from "@/lib/services/partidos";
import type { Partido } from "@/lib/types";
import type { MyMatchDesignation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PartidosTabsClient } from "./partidos-tabs-client";
import { CalendarDays, MapPin, Medal, Trophy, UserRound } from "lucide-react";
import { designationRoleOrder, getGoogleMapsDirectionsUrl } from "@/lib/utils";

export type MatchLogos = { localClubLogo: string | null; visitorClubLogo: string | null };

/** Solo roles de árbitro (pitar), no anotador ni cronometrador. */
function isRefereeRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase();
  return r.includes("arbitro") || r.includes("árbitro") || r.includes("principal") || r.includes("auxiliar");
}

/** Dado designaciones del partido y nombre del usuario actual, devuelve solo el otro árbitro: "Nombre" o "Solo". Principal primero, luego auxiliar. */
function getCompanionsLabel(
  designations: { refereeName: string; refereeSurname: string; refereeRole?: string }[],
  currentUserName: string | null | undefined
): string {
  const current = (currentUserName ?? "").trim().toLowerCase();
  const onlyReferees = designations
    .filter((d) => isRefereeRole(d.refereeRole))
    .sort((a, b) => designationRoleOrder(a.refereeRole) - designationRoleOrder(b.refereeRole));
  const others = onlyReferees
    .map((d) => ((d.refereeName ?? "").trim() + " " + (d.refereeSurname ?? "").trim()).trim())
    .filter((full) => full && full.toLowerCase() !== current);
  if (others.length === 0) return "Solo";
  return others.join(", ");
}

const MAX_LOCATION_CHARS = 32;

/** Dirección para mostrar (truncada) y para enlace a Maps (completa). */
function getMatchAddress(m: MyMatchDesignation): { display: string; full: string; forMaps: string } | null {
  const full = [m.installationName, m.town].filter(Boolean).join(", ") || m.installationAddress || null;
  if (!full) return null;
  const forMaps = m.installationAddress?.trim() || full;
  const display = full.length > MAX_LOCATION_CHARS ? full.slice(0, MAX_LOCATION_CHARS) + "..." : full;
  return { display, full, forMaps };
}

/** Contenedor fijo para igualar tamaño de escudos. */
function LogoCell({ src, alt = "" }: { src: string | null | undefined; alt?: string }) {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
      {src ? (
        <Image src={src} alt={alt} width={48} height={48} className="size-full object-contain" />
      ) : null}
    </div>
  );
}

/** Card de un partido de la API (esta semana). Muestra logos de equipos en lugar de nombres. */
function MyMatchRow({
  m,
  logos,
  companions,
}: {
  m: MyMatchDesignation;
  logos?: MatchLogos | null;
  companions?: string;
}) {
  const address = getMatchAddress(m);

  return (
    <div className="flex gap-3 border-b border-border py-4 last:border-0 last:pb-0">
      <Link
        href={"/partidos/" + m.matchId}
        className="flex shrink-0 flex-col items-center rounded-lg bg-primary/10 px-2.5 py-1.5 text-center transition-colors hover:bg-primary/20"
      >
        <span className="text-[10px] font-medium uppercase leading-tight text-primary">
          {m.matchDay ? new Date(m.matchDay).toLocaleDateString("es-ES", { weekday: "short" }) : "—"}
        </span>
        <span className="text-sm font-bold tabular-nums text-foreground">
          {m.matchDay ? new Date(m.matchDay).toLocaleDateString("es-ES", { day: "numeric" }) : "—"}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {m.matchDay ? new Date(m.matchDay).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}
        </span>
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <Link
          href={"/partidos/" + m.matchId}
          className="flex items-center justify-center gap-3 transition-opacity hover:opacity-90"
          title={m.localTeamName + " – " + m.visitorTeamName}
        >
          <LogoCell src={logos?.localClubLogo} />
          <span className="text-muted-foreground">–</span>
          <LogoCell src={logos?.visitorClubLogo} />
        </Link>
        {address && (
          <a
            href={getGoogleMapsDirectionsUrl(address.forMaps)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            title={address.full}
          >
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{address.display}</span>
            <span className="sr-only"> (abre Google Maps para indicaciones)</span>
          </a>
        )}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <Badge variant="secondary" className="text-[10px] font-normal">
            <UserRound className="mr-0.5 size-2.5" aria-hidden />
            {companions ?? "—"}
          </Badge>
          {m.categoryName?.trim() && (
            <Badge variant="outline" className="text-[10px] font-normal" title="Categoría">
              <Trophy className="mr-0.5 size-2.5" aria-hidden />
              {m.categoryName.trim()}
            </Badge>
          )}
          {m.competitionName?.trim() && (
            <Badge variant="outline" className="text-[10px] font-normal" title="Competición">
              <Medal className="mr-0.5 size-2.5" aria-hidden />
              {m.competitionName.trim()}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

/** Vista con partidos de esta semana (API). logosByMatchId y companionsByMatchId opcionales. */
function MyMatchesView({
  matches,
  logosByMatchId,
  companionsByMatchId,
}: {
  matches: MyMatchDesignation[];
  logosByMatchId: Map<number, MatchLogos>;
  companionsByMatchId: Map<number, string>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="page-title">Partidos de esta semana</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Designaciones</CardTitle>
          <CardDescription>
            {matches.length === 0
              ? "No tienes partidos asignados esta semana"
              : matches.length + " partido" + (matches.length !== 1 ? "s" : "") + " esta semana"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {matches.length === 0 ? (
            <div className="py-10">
              <div className="mx-auto flex max-w-[100px] justify-center text-muted-foreground/40">
                <CalendarDays className="size-16" strokeWidth="1.5" aria-hidden />
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                No tienes partidos esta semana.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {matches.map((m) => (
                <MyMatchRow
                  key={m.designationId}
                  m={m}
                  logos={logosByMatchId.get(m.matchId)}
                  companions={companionsByMatchId.get(m.matchId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Vista fallback (mock) con Tabs shadcn */
function FallbackPartidosView({ partidos }: { partidos: Partido[] }) {
  const pendientes = partidos.filter((p) => p.estado === "pendiente");
  const finalizados = partidos.filter((p) => p.estado === "finalizado");

  return (
    <div className="space-y-6">
      <h1 className="page-title">Partidos</h1>
      <Card>
        <PartidosTabsClient pendientes={pendientes} finalizados={finalizados} />
      </Card>
    </div>
  );
}

export default async function PartidosPage() {
  const session = await auth();
  const accessToken = (session as { accessToken?: string })?.accessToken;

  if (accessToken && process.env.EXTERNAL_API_URL && process.env.USE_MOCK_API !== "true") {
    try {
      const myMatches = await getMyMatches(accessToken);
      const logosByMatchId = new Map<number, MatchLogos>();
      const companionsByMatchId = new Map<number, string>();
      const currentUserName = session?.user?.name ?? null;

      await Promise.all(
        myMatches.map(async (m) => {
          try {
            const detail = await getMatchDetail(String(m.matchId));
            const match = detail.messageData?.match;
            const designations = detail.messageData?.designations ?? [];
            if (match) {
              logosByMatchId.set(m.matchId, {
                localClubLogo: match.localClubLogo ?? null,
                visitorClubLogo: match.visitorClubLogo ?? null,
              });
            }
            if (designations.length > 0) {
              const companions = getCompanionsLabel(
                designations as { refereeName: string; refereeSurname: string; refereeRole?: string }[],
                currentUserName
              );
              companionsByMatchId.set(m.matchId, companions);
            }
          } catch {
            // Sin datos extra para este partido
          }
        })
      );
      return (
        <MyMatchesView
          matches={myMatches}
          logosByMatchId={logosByMatchId}
          companionsByMatchId={companionsByMatchId}
        />
      );
    } catch {
      // Fallback
    }
  }

  const partidos = await getPartidos(accessToken);
  return <FallbackPartidosView partidos={partidos} />;
}
