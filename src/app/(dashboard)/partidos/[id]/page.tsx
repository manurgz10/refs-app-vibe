import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchDetail } from "@/lib/services/match-detail";
import type { FitxaPartitMatch, FitxaPartitDesignation, FitxaPartitStandingEntry } from "@/lib/services/match-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { designationRoleOrder, getGoogleMapsDirectionsUrl } from "@/lib/utils";
import { ArrowLeft, CalendarDays, MapPin, Users, Trophy, Award, Navigation } from "lucide-react";
import { SharePartidoButton, SHARE_AREA_ID } from "./share-partido-button";

function formatMatchDay(matchDay: string | null | undefined) {
  if (!matchDay) return "—";
  const d = new Date(matchDay);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function VenueBlock({ m }: { m: FitxaPartitMatch }) {
  const nameField = m.nameField || m.nameTown;
  const addressOnly = [m.addressField, m.postalCodeField, m.nameTown].filter(Boolean).join(", ");
  const fullAddressForMaps = [m.nameField, m.addressField, m.postalCodeField, m.nameTown]
    .filter(Boolean)
    .join(", ");
  if (!nameField && !addressOnly) return null;
  const forMaps = fullAddressForMaps.trim() || addressOnly?.trim() || nameField?.trim() || "";
  const displayAddress = [m.nameField, addressOnly].filter(Boolean).join(" · ") || nameField || "";
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="flex flex-wrap items-start gap-2 text-sm">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <p className="text-foreground">{displayAddress}</p>
        </div>
      </div>
      {forMaps && (
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <a
            href={getGoogleMapsDirectionsUrl(forMaps)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Navigation className="mr-2 size-4" aria-hidden />
            Cómo llegar
          </a>
        </Button>
      )}
    </div>
  );
}

export default async function PartidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await getMatchDetail(id);
  } catch (err) {
    console.error("[partidos/[id]] getMatchDetail failed:", err instanceof Error ? err.message : err);
    notFound();
  }
  const match = data.messageData?.match;
  const rawDesignations = (data.messageData?.designations ?? []) as FitxaPartitDesignation[];
  const designations = [...rawDesignations].sort(
    (a, b) => designationRoleOrder(a.refereeRole) - designationRoleOrder(b.refereeRole)
  );
  const standing = (data.messageData?.standing ?? []) as FitxaPartitStandingEntry[];
  const group = data.messageData?.group as { nameGroup?: string } | undefined;

  const hasResult =
    match &&
    match.localScore != null &&
    match.visitorScore != null &&
    String(match.localScore).trim() !== "" &&
    String(match.visitorScore).trim() !== "";

  const isLocalTeam = (row: FitxaPartitStandingEntry) =>
    match && (row.idTeam === match.idLocalTeam || row.teamName === match.nameLocalTeam);
  const isVisitorTeam = (row: FitxaPartitStandingEntry) =>
    match && (row.idTeam === match.idVisitorTeam || row.teamName === match.nameVisitorTeam);

  if (!match) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/partidos">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Volver a Partidos
          </Link>
        </Button>
        <SharePartidoButton />
      </div>

      <div id={SHARE_AREA_ID} className="space-y-6">
      {/* Encabezado: equipos y fecha */}
      <Card>
        <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1 text-center">
                {match.localClubLogo ? (
                  <img
                    src={match.localClubLogo}
                    alt=""
                    className="h-12 w-12 rounded-full object-contain sm:h-14 sm:w-14"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted sm:h-14 sm:w-14" />
                )}
                <span className="max-w-[120px] truncate text-xs font-medium text-muted-foreground sm:max-w-[140px]">
                  {match.nameLocalTeam}
                </span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                {hasResult ? (
                  <span className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                    {match.localScore} – {match.visitorScore}
                  </span>
                ) : (
                  <span className="text-lg font-semibold text-muted-foreground">–</span>
                )}
                {hasResult && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Resultado
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                {match.visitorClubLogo ? (
                  <img
                    src={match.visitorClubLogo}
                    alt=""
                    className="h-12 w-12 rounded-full object-contain sm:h-14 sm:w-14"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted sm:h-14 sm:w-14" />
                )}
                <span className="max-w-[120px] truncate text-xs font-medium text-muted-foreground sm:max-w-[140px]">
                  {match.nameVisitorTeam}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start gap-1 border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden />
                {formatMatchDay(match.matchDay)}
              </span>
              {match.numMatchDay && (
                <Badge variant="secondary" className="text-xs">
                  Jornada {match.numMatchDay}
                  {group?.nameGroup ? ` · ${group.nameGroup}` : ""}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categoría y competición */}
      <div className="flex flex-wrap gap-2">
        {match.nameCategory && (
          <Badge variant="secondary" className="text-xs">
            <Trophy className="mr-1 size-3" aria-hidden />
            {match.nameCategory}
          </Badge>
        )}
        {match.nameCompetition && (
          <Badge variant="outline" className="text-xs">
            <Award className="mr-1 size-3" aria-hidden />
            {match.nameCompetition}
          </Badge>
        )}
      </div>

      {/* Pabellón / dirección */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pabellón y dirección</CardTitle>
        </CardHeader>
        <CardContent>
          <VenueBlock m={match} />
        </CardContent>
      </Card>

      {/* Designaciones (árbitros) */}
      {designations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" aria-hidden />
              Designaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {designations.map((d) => (
                <li
                  key={d.designationId}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm font-medium text-foreground">
                    {d.refereeName} {d.refereeSurname}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {d.refereeRole}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Clasificación del grupo */}
      {standing.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Clasificación</CardTitle>
            {group?.nameGroup && (
              <p className="text-sm text-muted-foreground">{group.nameGroup}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-2 font-medium">#</th>
                    <th className="pb-2 pr-2 font-medium">Equipo</th>
                    <th className="pb-2 pr-2 text-center font-medium">P.J.</th>
                    <th className="pb-2 pr-2 text-center font-medium">P.G.</th>
                    <th className="pb-2 pr-2 text-center font-medium">P.P.</th>
                    <th className="pb-2 pl-2 text-right font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standing.slice(0, 12).map((row) => {
                    const isLocal = isLocalTeam(row);
                    const isVisitor = isVisitorTeam(row);
                    const rowClass = isLocal
                      ? "border-l-4 border-l-primary bg-primary/5 border-b border-border/70 last:border-0"
                      : isVisitor
                        ? "border-l-4 border-l-amber-500 bg-amber-500/5 border-b border-border/70 last:border-0"
                        : "border-b border-border/70 last:border-0";
                    return (
                      <tr key={row.idStanding ?? row.teamName ?? row.position} className={rowClass}>
                        <td className="py-1.5 pr-2 tabular-nums">{row.position}</td>
                        <td className="py-1.5 pr-2 font-medium">
                          {row.teamName}
                          {isLocal && (
                            <span className="ml-1 text-[10px] font-normal text-primary">(local)</span>
                          )}
                          {isVisitor && (
                            <span className="ml-1 text-[10px] font-normal text-amber-600 dark:text-amber-400">
                              (visitante)
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 pr-2 text-center tabular-nums">{row.matchPlayed}</td>
                        <td className="py-1.5 pr-2 text-center tabular-nums">{row.matchWin}</td>
                        <td className="py-1.5 pr-2 text-center tabular-nums">{row.matchLost}</td>
                        <td className="py-1.5 pl-2 text-right tabular-nums font-medium">
                          {row.standingScore}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
