import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDesignationsStatus } from "@/lib/services/designations-status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DesignationRow } from "@/components/designation-row";
import { Download, ArrowLeft } from "lucide-react";

export default async function DesignacionesDescargadasPage() {
  const session = await auth();
  const accessToken = (session as { accessToken?: string })?.accessToken;

  const useRealApi =
    accessToken &&
    process.env.EXTERNAL_API_URL &&
    process.env.USE_MOCK_API !== "true";

  if (!useRealApi) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Volver a Inicio
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Esta sección solo está disponible con la API externa configurada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let status;
  try {
    status = await getDesignationsStatus(accessToken!);
  } catch {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Volver a Inicio
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              No se pudieron cargar las designaciones.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const downloaded = status.downloaded;

  return (
    <div className="space-y-6 pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" aria-hidden />
              Volver a Inicio
            </Link>
          </Button>
          <h1 className="page-title mt-2">Designaciones descargadas</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-5" aria-hidden />
            Listado
          </CardTitle>
          <CardDescription>
            {downloaded.length === 0
              ? "No tienes designaciones descargadas en tu dispositivo"
              : `${downloaded.length} designación${downloaded.length !== 1 ? "es" : ""} descargada${downloaded.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {downloaded.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay designaciones descargadas.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {downloaded.map((d, index) => (
                <DesignationRow
                  key={d.designationId ?? d.matchDay ?? d.installationId ?? index}
                  d={d}
                  action="download"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
