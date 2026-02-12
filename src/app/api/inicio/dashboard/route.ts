import { auth } from "@/lib/auth";
import { getDesignationsStatus } from "@/lib/services/designations-status";
import { getMatchDetail } from "@/lib/services/match-detail";
import { getMyMatches } from "@/lib/services/my-matches";
import { getPartidos } from "@/lib/services/partidos";
import { NextResponse } from "next/server";
import type { DesignationsStatus, MyMatchDesignation, Partido } from "@/lib/types";

type NextMatchDetail = { localClubLogo?: string | null; visitorClubLogo?: string | null } | null;

export type InicioDashboardResponse = {
  refereeName: string;
  designationsStatus: DesignationsStatus | null;
  nextMatchApi: MyMatchDesignation | null;
  nextMatchDetail: NextMatchDetail;
  nextMatchMock: Partido | null;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const accessToken = (session as { accessToken?: string }).accessToken;
    const useRealApi =
      accessToken && process.env.EXTERNAL_API_URL && process.env.USE_MOCK_API !== "true";

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

    let nextMatchApi: MyMatchDesignation | null = null;
    let nextMatchDetail: NextMatchDetail = null;
    let nextMatchMock: Partido | null = null;

    if (myMatches.length > 0) {
      const now = Date.now();
      const sorted = [...myMatches].sort(
        (a, b) => new Date(a.matchDay).getTime() - new Date(b.matchDay).getTime()
      );
      nextMatchApi =
        sorted.find((m) => new Date(m.matchDay).getTime() >= now) ?? sorted[0] ?? null;
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

    const fullName = session?.user?.name?.trim() || "árbitro";
    const refereeName = fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => {
        const lower = part.toLocaleLowerCase("es-ES");
        return lower ? lower[0].toLocaleUpperCase("es-ES") + lower.slice(1) : part;
      })
      .join(" ");

    const payload: InicioDashboardResponse = {
      refereeName,
      designationsStatus,
      nextMatchApi,
      nextMatchDetail,
      nextMatchMock,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/inicio/dashboard:", err);
    return NextResponse.json(
      { error: "No se pudo cargar el inicio" },
      { status: 500 }
    );
  }
}
