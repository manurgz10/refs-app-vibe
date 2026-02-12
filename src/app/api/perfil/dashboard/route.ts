import { auth } from "@/lib/auth";
import { getRefereePersonalData } from "@/lib/services/referee";
import type { RefereePersonalData } from "@/lib/types";
import { NextResponse } from "next/server";

export type PerfilDashboardResponse = {
  data: RefereePersonalData;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const accessToken = (session as { accessToken?: string }).accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const data = await getRefereePersonalData(accessToken);
    const payload: PerfilDashboardResponse = { data };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/perfil/dashboard:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar los datos" },
      { status: 500 }
    );
  }
}
