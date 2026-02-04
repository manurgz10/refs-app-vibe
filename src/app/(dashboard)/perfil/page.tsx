import { auth } from "@/lib/auth";
import { getRefereePersonalData } from "@/lib/services/referee";
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
export default async function PerfilPage() {
  const session = await auth();
  const accessToken = (session as { accessToken?: string })?.accessToken;

  if (!accessToken) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">
            No se pudo cargar la información. Inicia sesión de nuevo.
          </p>
        </CardContent>
      </Card>
    );
  }

  let data: RefereePersonalData;
  try {
    data = await getRefereePersonalData(accessToken);
  } catch {
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

  const fullName = [data.name, data.lastName].filter(Boolean).join(" ").trim() || "";
  const phone = data.phoneMobile || data.phoneParticular || data.phoneWork || null;
  const location = [data.address, data.postalCode, data.townName].filter(Boolean).join(", ") || null;

  const items: { label: string; value: string }[] = [
    { label: "Nombre", value: fullName },
    { label: "Nº árbitro", value: String(data.refereeNumber ?? "") },
    { label: "Email", value: data.email || "" },
    { label: "Teléfono", value: phone || "" },
    { label: "Localidad", value: location || data.townName || "" },
    { label: "Categoría", value: data.categoryName || "" },
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
          {(data.active != null || data.enabled != null) && (
            <div className="flex flex-wrap gap-2 pt-4">
              {data.active != null && (
                <Badge variant={data.active ? "success" : "secondary"}>
                  {data.active ? "Activo" : "Inactivo"}
                </Badge>
              )}
            </div>
          )}
          <div className="mt-6 border-t border-border pt-6">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
