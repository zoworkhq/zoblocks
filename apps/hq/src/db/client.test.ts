import { describe, expect, it } from "vitest";
import { database, mongo } from "./client";

/**
 * The connection string is shared, and its path segment points at the marketing
 * site's Payload database. Honouring it would write hq's users and tasks into
 * the CMS — so the database name is fixed in code, never taken from the URI.
 *
 * This is also what makes a `readWrite`-on-`hq` credential the correct scope
 * for this app: if the name could come from the URI, the scope would depend on
 * a string in an environment variable rather than on anything reviewable.
 */
describe("database selection", () => {
  it("uses the configured name, not the one in the connection string", async () => {
    const original = process.env.DATABASE_URL!;
    const cached = globalThis.__hqMongo;

    // A URI whose path names someone else's database entirely.
    const base = original.replace(/\/[^/?]*(\?.*)?$/, "");
    const query = original.includes("?") ? original.slice(original.indexOf("?")) : "";
    process.env.DATABASE_URL = `${base}/payload_marketing_site${query}`;
    globalThis.__hqMongo = undefined;

    try {
      expect(database().databaseName).toBe("hq_test");
      expect(database().databaseName).not.toBe("payload_marketing_site");
      await mongo().client.close();
    } finally {
      process.env.DATABASE_URL = original;
      globalThis.__hqMongo = cached;
    }
  });

  it("refuses to guess when no connection string is configured", async () => {
    const original = process.env.DATABASE_URL;
    const cached = globalThis.__hqMongo;

    delete process.env.DATABASE_URL;
    globalThis.__hqMongo = undefined;

    try {
      expect(() => database()).toThrow(/DATABASE_URL/);
    } finally {
      process.env.DATABASE_URL = original;
      globalThis.__hqMongo = cached;
    }
  });
});
