import type { RefereePersonalData } from "@/lib/types";
import { SignOutButton } from "@/components/sign-out-button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { Settings, UserRound } from "lucide-react";

type SessionWithProfile = { profile?: RefereePersonalData | Record<string, unknown> };

export default async function PerfilPage() {
  const session = (await auth()) as (SessionWithProfile | null);
  const profile = (session?.profile ?? null) as RefereePersonalData | null;
  if (!profile) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">
            No se pudieron cargar los datos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fullName = [profile.name, profile.lastName].filter(Boolean).join(" ").trim() || "";
  const phone = profile.phoneMobile || profile.phoneParticular || profile.phoneWork || null;
  const location = [profile.address, profile.postalCode, profile.townName].filter(Boolean).join(", ") || null;

  const items: { label: string; value: string }[] = [
    { label: "Nombre", value: fullName },
    { label: "Nº Licencia", value: String(profile.refereeNumber ?? "") },
    { label: "Email", value: profile.email || "" },
    { label: "Teléfono", value: phone || "" },
    { label: "Dirección", value: location || profile.townName || "" },
    { label: "Categoría", value: profile.categoryName || "" },
  ].filter((i) => i.value.trim() !== "");

  return (
    <div className="space-y-4 pb-5 sm:pb-0">
      <div className="flex h-8 items-center gap-2">
        <UserRound className="size-5 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">Datos personales</h1>
      </div>
      <Card>
        <CardContent>
          <dl className="divide-y">
            {items.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5 py-4 first:pt-0 sm:flex-row sm:gap-4 sm:py-3">
                <dt className="min-w-[6rem] text-sm font-medium text-muted-foreground">
                  {label}
                </dt>
                <dd className="text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <div className="space-y-4 mb-5">
        <div className="flex h-8 items-center gap-2">
          <Settings className="size-5 text-muted-foreground" aria-hidden />
          <h2 className="text-lg font-semibold">Configuracion</h2>
          <Badge variant="destructive" className="text-[10px]">NO DISPONIBLE</Badge>
        </div>
        <Card>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="pref-push" className="text-sm font-medium text-foreground">
                  Mostrar todo el Equipo Arbitral
                </label>
                <label className="relative inline-flex cursor-not-allowed items-center opacity-60">
                  <input
                    id="pref-push"
                    name="pref-push"
                    type="checkbox"
                    className="peer sr-only"
                    disabled
                  />
                  <span className="h-6 w-11 rounded-full bg-muted" />
                  <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white" />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="border-t border-border pt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
