const getBaseUrl = () => process.env.EXTERNAL_API_URL?.replace(/\/$/, "") ?? "";
const getApiKey = () => process.env.EXTERNAL_API_KEY ?? "";
/** Valor por defecto del header Federation (API federación). */
const getFederationHeader = () => process.env.FEDERATION_HEADER ?? "FBIB";

/**
 * Llamada a la API externa. Incluye siempre:
 * - Federation: FBIB (o FEDERATION_HEADER)
 * - Authorization: Bearer <token> cuando se pasa accessToken
 */
export async function externalFetch<T = unknown>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, ...fetchOptions } = options;
  const base = getBaseUrl();
  if (!base) {
    throw new Error("EXTERNAL_API_URL no configurada");
  }
  const url = path.startsWith("http") ? path : `${base}/${path.replace(/^\//, "")}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Federation: getFederationHeader(),
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (getApiKey()) {
    (headers as Record<string, string>)["X-API-Key"] = getApiKey();
  }
  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }
  const method = (fetchOptions.method ?? "GET").toUpperCase();
  const cacheOptions =
    method === "GET"
      ? {
          cache: "force-cache" as RequestCache,
          next: { revalidate: 5 * 60 },
        }
      : {};

  const res = await fetch(url, { ...fetchOptions, headers, ...cacheOptions });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API externa error ${res.status}: ${text || res.statusText}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as T;
}

/**
 * POST a la API externa devolviendo el cuerpo como ArrayBuffer (p. ej. PDF).
 * Usado para auth/my-referee/designations/accept cuando la respuesta es un archivo.
 */
export async function externalFetchBinary(
  path: string,
  options: { accessToken: string; body: Record<string, string> }
): Promise<ArrayBuffer> {
  const base = getBaseUrl();
  if (!base) throw new Error("EXTERNAL_API_URL no configurada");
  const url = path.startsWith("http") ? path : `${base}/${path.replace(/^\//, "")}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Federation: getFederationHeader(),
    Authorization: `Bearer ${options.accessToken}`,
  };
  if (getApiKey()) {
    (headers as Record<string, string>)["X-API-Key"] = getApiKey();
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(options.body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API externa error ${res.status}: ${text || res.statusText}`);
  }
  return res.arrayBuffer();
}
