// Basic Auth para /dashboard/* — roda no edge do Netlify, antes de servir
// qualquer arquivo estático da pasta. Usuário e senha vêm de env vars do
// Netlify (Site settings → Environment variables), NUNCA hardcoded aqui:
//   DASHBOARD_USER
//   DASHBOARD_PASSWORD
//
// Sem essas duas variáveis configuradas no Netlify, o dashboard fica
// bloqueado (falha fechada, não aberta).

export default async (request, context) => {
  const user = Deno.env.get("DASHBOARD_USER");
  const pass = Deno.env.get("DASHBOARD_PASSWORD");

  if (!user || !pass) {
    return new Response(
      "Dashboard não configurado: defina DASHBOARD_USER e DASHBOARD_PASSWORD nas variáveis de ambiente do Netlify.",
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const [scheme, encoded] = authHeader.split(" ");

  if (scheme === "Basic" && encoded) {
    let decoded = "";
    try {
      decoded = atob(encoded);
    } catch (e) {
      decoded = "";
    }
    const sepIndex = decoded.indexOf(":");
    const suppliedUser = sepIndex >= 0 ? decoded.slice(0, sepIndex) : "";
    const suppliedPass = sepIndex >= 0 ? decoded.slice(sepIndex + 1) : "";
    if (suppliedUser === user && suppliedPass === pass) {
      return context.next();
    }
  }

  return new Response("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Dashboard Somar.IA"' },
  });
};

export const config = { path: "/dashboard/*" };
