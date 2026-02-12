import { auth } from "@/lib/auth";
import { getLiquidaciones } from "@/lib/services/liquidaciones";
import { getPaymentsNotPending } from "@/lib/services/payments-not-pending";
import { getPreliquidationWeekly } from "@/lib/services/preliquidation-weekly";
import { NextResponse } from "next/server";

export type LiquidacionesDashboardResponse =
  | {
      mode: "api";
      weekly: Awaited<ReturnType<typeof getPreliquidationWeekly>>;
      historico: Awaited<ReturnType<typeof getPaymentsNotPending>>;
    }
  | {
      mode: "fallback";
      liquidaciones: Awaited<ReturnType<typeof getLiquidaciones>>;
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

    if (useRealApi) {
      const [weekly, historico] = await Promise.all([
        getPreliquidationWeekly(accessToken!),
        getPaymentsNotPending(accessToken!),
      ]);
      const payload: LiquidacionesDashboardResponse = {
        mode: "api",
        weekly,
        historico,
      };
      return NextResponse.json(payload);
    }

    const liquidaciones = await getLiquidaciones(accessToken);
    const payload: LiquidacionesDashboardResponse = {
      mode: "fallback",
      liquidaciones,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/liquidaciones/dashboard:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar las liquidaciones" },
      { status: 500 }
    );
  }
}
