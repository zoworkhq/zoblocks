/**
 * The marketplace, end to end.
 *
 * The unit suite proves the rules — who may buy, what an entitlement is worth,
 * that fulfilment happens once. What it cannot prove is that a person can get
 * from a catalogue to a downloaded file, because every step between those two
 * is a screen.
 *
 * Nothing here spends money. A card purchase would need Stripe's hosted page
 * and a live key, and driving somebody else's checkout in CI tests Stripe
 * rather than us. What *is* driven is the path that money merely triggers:
 * grant → owned → install into a draft → download the bytes. The webhook that
 * grants after a real payment calls the same code the grant control does.
 */

import { expect, test, type Page } from "@playwright/test";

const BASE = process.env.OXYGEN_CONSOLE_URL ?? "http://localhost:6003";
const ADMIN = { email: "admin@northwind.example", password: "correct-horse-battery-staple" };

/** Seeded by `scripts/seed-market.mjs`, which the e2e server runs. */
const ICONS = "clinical-icons";
const EMPTY_STATES = "empty-state-system";
/** Seeded, listed, and deliberately never granted by anything in this file. */
const NEVER_BOUGHT = "messy-fixtures";

async function signIn(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email", { exact: true }).fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/themes$/);
}

/**
 * Take an item without paying, the way a contract bundle arrives.
 *
 * The fourth money route, and the one that exists precisely so entitlements do
 * not depend on Stripe. It leaves the organisation in exactly the state a
 * completed checkout would.
 */
async function grant(page: Page, slug: string, reason = "E2E-2026-01") {
  await page.goto(`${BASE}/market/${slug}`);

  /*
   * The database is seeded once for the whole run, not per test.
   *
   * So an entitlement granted by an earlier test is still there — and once an
   * item is owned the Buy panel is replaced by the Install panel, taking this
   * form with it. Waiting for a control that correct behaviour has removed is
   * a thirty-second timeout and a failure that says nothing.
   *
   * Making the helper idempotent matches what it models: granting something an
   * organisation already owns is a no-op in the product too.
   */
  if (
    await page
      .getByText("Owned", { exact: true })
      .isVisible()
      .catch(() => false)
  )
    return;

  await page.getByRole("group").filter({ hasText: "Granted with a contract" }).click();
  await page.getByLabel("Reason", { exact: true }).fill(reason);
  await page.getByRole("button", { name: "Grant without charging" }).click();

  /*
   * The outcome, not the message.
   *
   * A successful grant revalidates the page and the Buy panel — which is where
   * the form and its confirmation live — is replaced by the Install panel. So
   * the confirmation is genuinely gone by the time the page settles, and
   * waiting for it would be waiting for something correct behaviour removes.
   */
  await expect(page.getByText("Owned", { exact: true })).toBeVisible();
}

test.describe("@console the catalogue", () => {
  test("lists what is for sale, with its price and its kind", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/market`);

    await expect(page.getByRole("heading", { name: "Catalogue" })).toBeVisible();

    const card = page.getByRole("listitem").filter({ hasText: "Empty-state system" });
    await expect(card).toContainText("$290");
    await expect(card).toContainText("Illustration");
  });

  test("the item page shows what was checked, not an adjective", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/market/${EMPTY_STATES}`);

    /*
     * The evidence column is the product. A customer can lift it into the
     * accessibility file their own procurement is asking them for — which only
     * works if it states measurements rather than claims.
     */
    await expect(page.getByText(/contrast pairs at or above/)).toBeVisible();
    await expect(page.getByText(/Forced colors verified/)).toBeVisible();

    // And the refusals, which are the part a clinical safety officer reads.
    await expect(page.getByText(/Not a medical device/)).toBeVisible();
    await expect(page.getByText(/Resale prohibited/)).toBeVisible();
  });

  test("says the purchase belongs to the organisation, not the buyer", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/market/${EMPTY_STATES}`);
    await expect(page.getByText("one-time · whole organisation")).toBeVisible();
  });
});

test.describe("@console owning something", () => {
  test("grants without charging, and the item says so afterwards", async ({ page }) => {
    await signIn(page);
    await grant(page, EMPTY_STATES);

    await page.goto(`${BASE}/market/${EMPTY_STATES}`);
    await expect(page.getByText("Owned", { exact: true })).toBeVisible();

    // And it appears on Purchases, with the reason it was granted for.
    await page.goto(`${BASE}/market/purchases`);
    await expect(page.getByRole("link", { name: "Empty-state system" })).toBeVisible();
    await expect(page.getByText("E2E-2026-01")).toBeVisible();
  });

  test("downloads the pack it owns, and refuses the one it does not", async ({ page }) => {
    await signIn(page);
    await grant(page, EMPTY_STATES);

    const owned = await page.request.get(`${BASE}/m/${EMPTY_STATES}/pack.zip`);
    expect(owned.status()).toBe(200);
    expect(owned.headers()["content-disposition"]).toContain("attachment");
    // A shared cache must never hold this: the URL does not carry the identity
    // that made it servable — the session cookie does.
    expect(owned.headers()["cache-control"]).toContain("no-store");
    expect((await owned.body()).subarray(0, 2).toString()).toBe("PK");

    /*
     * The one route in this console that is not public. A miss is a flat 404
     * either way — "that item exists and you have not bought it" is not a fact
     * worth handing to somebody enumerating the catalogue.
     *
     * Checked against an item **no test in this file ever grants**. The suite
     * shares one seeded database, so asserting "not owned" about something a
     * sibling test buys is a race that passes alone and fails in a full run.
     */
    const notOwned = await page.request.get(`${BASE}/m/${NEVER_BOUGHT}/pack.zip`);
    expect(notOwned.status()).toBe(404);
  });

  test("installs glyphs into a draft and does not publish anything", async ({ page }) => {
    await signIn(page);
    await grant(page, ICONS, "E2E-icons");

    await page.goto(`${BASE}/market/${ICONS}`);
    await page.getByRole("button", { name: "Install glyphs" }).click();

    /*
     * Scoped to `main`, because every action result appears twice on purpose —
     * inline where the reader is working, and as a toast so they know it
     * happened at all. `ActionForm` says as much. An unscoped locator is a
     * strict-mode violation rather than a stronger assertion.
     */
    const result = page.getByRole("main").getByText(/Installed \d+ glyphs? into the draft/);
    await expect(result).toBeVisible();
    // The whole point of routing an install through a draft: publishing stays
    // a separate decision, made by somebody who holds `theme.publish`.
    await expect(result).toContainText("Publish the theme when you are ready");
  });
});

test.describe("@console access tokens", () => {
  test("shows a token once, then never again, and revoking stops it", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/market/tokens`);

    await page.getByLabel("Label", { exact: true }).fill("E2E machine");
    await page.getByRole("button", { name: "Mint", exact: true }).click();

    // The only moment the value exists outside the customer's machine.
    /*
     * Long enough to be a token, because the same screen documents the header
     * with a literal `oxy_live_…` and a looser pattern matches the example
     * instead of the thing that was just minted.
     */
    const shown = page.getByText(/oxy_live_[\w-]{30,}/).first();
    await expect(shown).toBeVisible();
    const token = (await shown.textContent())?.match(/oxy_live_[\w-]{30,}/)?.[0];
    expect(token).toBeTruthy();

    // It installs nothing yet — this organisation owns no component.
    const denied = await page.request.get(`${BASE}/r/pro/vitals-flowsheet.json`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(denied.status()).toBe(404);

    // Grant the component, and the same token now serves it.
    await grant(page, "vitals-flowsheet", "E2E-component");
    const served = await page.request.get(`${BASE}/r/pro/vitals-flowsheet.json`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(served.status()).toBe(200);
    expect((await served.json()).files[0].content).toContain("VitalsFlowsheet");

    // Back to the token screen — `grant` left us on the item page it opened.
    await page.goto(`${BASE}/market/tokens`);
    await expect(page.getByText("E2E machine")).toBeVisible();
    // The documented `oxy_live_…` example survives; a real token does not.
    await expect(page.getByText(/oxy_live_[\w-]{30,}/)).toHaveCount(0);

    await page.getByRole("button", { name: "Revoke" }).first().click();
    await expect(page.getByText("Revoked", { exact: true })).toBeVisible();

    const afterRevoke = await page.request.get(`${BASE}/r/pro/vitals-flowsheet.json`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(afterRevoke.status()).toBe(404);
  });

  test("a request with no credential is told what is missing", async ({ page }) => {
    // The one place a 401 is right rather than a 404: no credential at all is a
    // configuration mistake, not an attempt to enumerate the catalogue.
    const response = await page.request.get(`${BASE}/r/pro/vitals-flowsheet.json`);
    expect(response.status()).toBe(401);
    expect(response.headers()["www-authenticate"]).toContain("Bearer");
  });
});

test.describe("@console the webhook", () => {
  test("refuses an unsigned payload", async ({ page }) => {
    // Everything in a webhook payload — organisation ids included — is
    // attacker-controlled until the signature checks out.
    const response = await page.request.post(`${BASE}/api/stripe/webhook`, {
      data: { type: "checkout.session.completed", data: { object: {} } },
    });
    expect(response.status()).toBe(400);
  });

  test("refuses a forged signature", async ({ page }) => {
    const response = await page.request.post(`${BASE}/api/stripe/webhook`, {
      headers: { "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=${"0".repeat(64)}` },
      data: { type: "checkout.session.completed", data: { object: {} } },
    });
    expect(response.status()).toBe(400);
  });
});
