import { readFileSync } from "node:fs";
import path from "node:path";
import type { Config } from "drizzle-kit";

/**
 * drizzle-kit runs outside Next, so it never sees .env.local. Load it here
 * rather than making every db: script remember to export DATABASE_URL first.
 * A real environment variable always wins, so CI and Vercel are unaffected.
 */
function loadLocalEnv(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  try {
    const file = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    const line = file.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (!line) return "";
    return line
      .slice(line.indexOf("=") + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: loadLocalEnv() },
  strict: true,
} satisfies Config;
