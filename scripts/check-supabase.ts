// Checks the Supabase connection with the public env vars.
// Run with `npm run supabase:check` (Node type stripping, vars from .env.local).

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

function fail(reason: string) {
  console.error(`[ERR] ${reason}`);
  process.exitCode = 1;
}

async function main() {
  const missing = REQUIRED.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    return fail(`Falta la variable de entorno ${missing.join(", ")}`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  let res: Response;
  try {
    res = await fetch(new URL("/auth/v1/health", url), {
      headers: { apikey: key },
    });
  } catch (err) {
    return fail(
      `No se pudo conectar con ${url}: ${err instanceof Error ? err.message : err}`,
    );
  }

  if (!res.ok) {
    return fail(`Supabase respondió ${res.status} ${res.statusText} en ${url}`);
  }

  console.log(`[OK] Supabase conectado: ${url}`);
}

main();
