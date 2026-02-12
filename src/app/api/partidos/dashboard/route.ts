import { auth } from "@/lib/auth";
import { getMatchDetail } from "@/lib/services/match-detail";
import { getMyMatches } from "@/lib/services/my-matches";
import { getPartidos } from "@/lib/services/partidos";
import { designationRoleOrder } from "@/lib/utils";
import { NextResponse } from "next/server";

type MatchLogos = { localClubLogo: string | null; visitorClubLogo: string | null };

type DashboardResponse =
  | {
      mode: "my-matches";
      matches: Awaited<ReturnType<typeof getMyMatches>>;
      logosByMatchId: Record<string, MatchLogos>;
      companionsByMatchId: Record<string, string>;
    }
  | {
      mode: "partidos";
      partidos: Awaited<ReturnType<typeof getPartidos>>;
    };

/** Solo roles de árbitro (pitar), no anotador ni cronometrador. */
function isRefereeRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase();
  return r.includes("arbitro") || r.includes("árbitro") || r.includes("principal") || r.includes("auxiliar");
}

/** Dado designaciones del partido y nombre del usuario actual, devuelve solo el otro árbitro: "Nombre" o "Solo". */
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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const accessToken = (session as { accessToken?: string }).accessToken;
    const useRealApi =
      accessToken && process.env.EXTERNAL_API_URL && process.env.USE_MOCK_API !== "true";

    if (!useRealApi) {
      const partidos = await getPartidos(accessToken);
      const payload: DashboardResponse = { mode: "partidos", partidos };
      return NextResponse.json(payload);
    }

    const myMatches = await getMyMatches(accessToken);
    const logosByMatchId: Record<string, MatchLogos> = {};
    const companionsByMatchId: Record<string, string> = {};
    const currentUserName = session?.user?.name ?? null;

    await Promise.all(
      myMatches.map(async (m) => {
        try {
          const detail = await getMatchDetail(String(m.matchId));
          const match = detail.messageData?.match;
          const designations = detail.messageData?.designations ?? [];
          if (match) {
            logosByMatchId[String(m.matchId)] = {
              localClubLogo: match.localClubLogo ?? null,
              visitorClubLogo: match.visitorClubLogo ?? null,
            };
          }
          if (designations.length > 0) {
            const companions = getCompanionsLabel(
              designations as { refereeName: string; refereeSurname: string; refereeRole?: string }[],
              currentUserName
            );
            companionsByMatchId[String(m.matchId)] = companions;
          }
        } catch {
          // Sin datos extra para este partido
        }
      })
    );

    const payload: DashboardResponse = {
      mode: "my-matches",
      matches: myMatches,
      logosByMatchId,
      companionsByMatchId,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/partidos/dashboard:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar los partidos" },
      { status: 500 }
    );
  }
}
