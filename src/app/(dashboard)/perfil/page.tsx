"use client";

import type { RefereePersonalData } from "@/lib/types";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { PerfilDashboardResponse } from "@/app/api/perfil/dashboard/route";

async function fetchPerfil(): Promise<PerfilDashboardResponse> {
  const res = await fetch("/api/perfil/dashboard");
  if (!res.ok) {
    throw new Error("No se pudieron cargar los datos");
  }
  return res.json() as Promise<PerfilDashboardResponse>;
}

export default function PerfilPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["perfil"],
    queryFn: fetchPerfil,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading && !data) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Cargando perfil...
      </div>
    );
  }

  if (isError && !data) {
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

  const profile: RefereePersonalData | null = data?.data ?? null;
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
    { label: "Nº árbitro", value: String(profile.refereeNumber ?? "") },
    { label: "Email", value: profile.email || "" },
    { label: "Teléfono", value: phone || "" },
    { label: "Localidad", value: location || profile.townName || "" },
    { label: "Categoría", value: profile.categoryName || "" },
  ].filter((i) => i.value.trim() !== "");

  return (
    <div className="space-y-6">
      <h1 className="page-title">Mi perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
          <CardDescription>Información de tu cuenta de árbitro</CardDescription>
        </CardHeader>
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
          <div className="border-t border-border pt-6">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
