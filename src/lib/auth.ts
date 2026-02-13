import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
        type: { label: "Tipo", type: "text" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        const type = (credentials?.type as string | undefined) ?? "";
        if (!username || !password) return null;

        const envEmail = process.env.CREDENTIALS_EMAIL;
        const envPassword = process.env.CREDENTIALS_PASSWORD;
        if (envEmail && envPassword && username === envEmail && password === envPassword) {
          return {
            id: "1",
            email: envEmail,
            name: username.split("@")[0],
          };
        }

        const loginUrl = process.env.EXTERNAL_API_LOGIN_URL;
        const federationHeader = process.env.FEDERATION_HEADER ?? "FBIB";
        if (loginUrl) {
          try {
            const res = await fetch(loginUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Federation: federationHeader,
              },
              body: JSON.stringify({ username, password, type }),
            });
            if (!res.ok) return null;

            const authHeader = res.headers.get("Authorization") ?? res.headers.get("authorization");
            const bearerToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
            if (!bearerToken) return null;

            const baseUrl = process.env.EXTERNAL_API_URL?.replace(/\/$/, "");
            if (baseUrl) {
              const personalRes = await fetch(`${baseUrl}/auth/my-referee/personal-data`, {
                headers: {
                  Authorization: `Bearer ${bearerToken}`,
                  Federation: federationHeader,
                },
              });
              if (personalRes.ok) {
                const personal = (await personalRes.json()) as {
                  id?: number;
                  userId?: string;
                  name?: string;
                  lastName?: string;
                  email?: string;
                  [key: string]: unknown;
                };
                const id = String(personal.id ?? personal.userId ?? "external");
                const name = [personal.name, personal.lastName].filter(Boolean).join(" ") || personal.email || username;
                const email = personal.email ?? username;
                return {
                  id,
                  email,
                  name,
                  accessToken: bearerToken,
                  profile: personal,
                };
              }
            }

            return {
              id: "external",
              email: username,
              name: username,
              accessToken: bearerToken,
            };
          } catch {
            return null;
          }
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        if ("accessToken" in user && user.accessToken) {
          token.accessToken = user.accessToken as string;
        }
        if ("profile" in user && user.profile) {
          token.profile = user.profile as Record<string, unknown>;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        if (token.accessToken) {
          (session as { accessToken?: string }).accessToken = token.accessToken as string;
        }
        if (token.profile) {
          (session as { profile?: Record<string, unknown> }).profile = token.profile as Record<string, unknown>;
        }
      }
      return session;
    },
    authorized({ request, auth: session }) {
      const path = request.nextUrl.pathname;
      const isLogin = path === "/login";
      if (isLogin && session) {
        return Response.redirect(new URL("/", request.url));
      }
      if (!isLogin && !session && !path.startsWith("/api/auth")) {
        return Response.redirect(new URL("/login", request.url));
      }
      return true;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
});
