/**
 * The theme choice, and the origin hop it has to survive.
 *
 * `src/lib/theme.ts` was at 0% — which is worth naming, because the coverage
 * config's own comment says the floor exists to protect "the theme lifecycle
 * that decides whether a failing palette can reach a customer's application".
 * The module that decides it had no tests at all.
 *
 * Four behaviours here are load-bearing and none of them is visible by reading
 * the source next to a passing suite:
 *
 *   The cookie beats `localStorage`, because the cookie is the half that
 *   crosses from `oxygenui.design` to `app.oxygenui.design`. Reading storage
 *   first would make a reader who chose dark on the docs site land on a white
 *   login screen.
 *
 *   Two legacy keys are still read. They are what this app called the value
 *   before the cookie and before it was the console, and dropping either
 *   silently resets the theme for everybody who set it then.
 *
 *   `high-contrast` is a third palette rather than a modifier on the other
 *   two. Applying it must remove `dark`, or a reader gets two half-applied
 *   token sets at once.
 *
 *   The cookie is scoped to the registrable domain in production and to
 *   nothing on localhost or a preview origin. Asserted on the string that is
 *   written rather than on the jar, because jsdom correctly refuses a cookie
 *   for a domain the document does not own — which is the same rule the
 *   browser applies, and the reason the empty-domain branch exists.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_BOOT_SCRIPT,
  THEME_COOKIE,
  THEME_STORAGE_KEY,
  applyTheme,
  readStoredTheme,
  resolveTheme,
  writeTheme,
} from "@/lib/theme";

/** Every cookie string the module wrote during a test. */
let written: string[] = [];
/** What `document.cookie` reads back. Set per test. */
let cookieJar = "";

const LEGACY_KEYS = ["oxygen-app-theme", "oxygen-console-theme"];

function stubMatchMedia(prefersDark: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: prefersDark && query.includes("dark"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  written = [];
  cookieJar = "";

  // An own property on the instance, so the prototype accessor is untouched
  // and `afterEach` can put it back by deleting this one.
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => cookieJar,
    set: (value: string) => {
      written.push(value);
      // Mirror only the name=value pair, the way a jar would.
      const pair = value.split(";")[0];
      if (pair) cookieJar = pair;
    },
  });

  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-ox-theme");
  stubMatchMedia(false);
  vi.stubGlobal("location", { hostname: "localhost" });
});

afterEach(() => {
  delete (document as unknown as { cookie?: unknown }).cookie;
  vi.unstubAllGlobals();
  localStorage.clear();
});

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

describe("readStoredTheme", () => {
  it("returns null when nothing has ever been chosen", () => {
    expect(readStoredTheme()).toBeNull();
  });

  it("reads the cookie", () => {
    cookieJar = `${THEME_COOKIE}=dark`;
    expect(readStoredTheme()).toBe("dark");
  });

  it("prefers the cookie over localStorage, because the cookie is the half that travels", () => {
    cookieJar = `${THEME_COOKIE}=light`;
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    // A reader who chose light on the docs site must not land on dark here.
    expect(readStoredTheme()).toBe("light");
  });

  it("finds the cookie when it is not the first one in the header", () => {
    cookieJar = `session=abc; ${THEME_COOKIE}=dark; other=1`;
    expect(readStoredTheme()).toBe("dark");
  });

  it("decodes a percent-encoded value rather than failing to match it", () => {
    cookieJar = `${THEME_COOKIE}=${encodeURIComponent("high-contrast")}`;
    expect(readStoredTheme()).toBe("high-contrast");
  });

  it("falls back to localStorage when there is no cookie", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "high-contrast");
    expect(readStoredTheme()).toBe("high-contrast");
  });

  it.each(LEGACY_KEYS)("still reads the legacy key %s", (key) => {
    // Dropping either silently resets the theme for everybody who set it
    // before the rename.
    localStorage.setItem(key, "dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("prefers the current key over a legacy one", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    localStorage.setItem("oxygen-app-theme", "dark");
    expect(readStoredTheme()).toBe("light");
  });

  it("returns null for a value it does not recognise, rather than passing it through", () => {
    cookieJar = `${THEME_COOKIE}=sepia`;
    expect(readStoredTheme()).toBeNull();
  });

  it("returns null when an empty cookie value shadows storage", () => {
    // `oxygen-theme=` is present-but-empty, which is not "unset": the module
    // treats it as a value and rejects it rather than reaching past it.
    cookieJar = `${THEME_COOKIE}=`;
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBeNull();
  });

  it("returns null rather than throwing when storage is refused", () => {
    // Private mode, or a browser with cookies and storage disabled.
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      },
    });
    expect(readStoredTheme()).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Resolving                                                           */
/* ------------------------------------------------------------------ */

describe("resolveTheme", () => {
  it("passes a stored choice straight through", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("high-contrast")).toBe("high-contrast");
  });

  it("follows the machine when nothing is stored", () => {
    stubMatchMedia(true);
    expect(resolveTheme(null)).toBe("dark");

    stubMatchMedia(false);
    expect(resolveTheme(null)).toBe("light");
  });

  it("does not consult the machine once a choice exists", () => {
    // "system" is gone as a button but survives as behaviour, and the
    // distinction is exactly this: a stored light must beat a dark OS.
    stubMatchMedia(true);
    expect(resolveTheme("light")).toBe("light");
  });
});

/* ------------------------------------------------------------------ */
/* Applying                                                            */
/* ------------------------------------------------------------------ */

describe("applyTheme", () => {
  const root = () => document.documentElement;

  it("adds the class for dark and removes it for light", () => {
    applyTheme("dark");
    expect(root().classList.contains("dark")).toBe(true);

    applyTheme("light");
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("treats high contrast as a third palette, not a modifier on dark", () => {
    applyTheme("dark");
    applyTheme("high-contrast");

    // Both at once would give a reader two half-applied token sets.
    expect(root().getAttribute("data-ox-theme")).toBe("high-contrast");
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("clears the high-contrast attribute on the way back out", () => {
    applyTheme("high-contrast");
    applyTheme("dark");

    expect(root().hasAttribute("data-ox-theme")).toBe(false);
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("leaves unrelated classes alone", () => {
    root().className = "font-sans";
    applyTheme("dark");
    expect(root().classList.contains("font-sans")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

describe("writeTheme", () => {
  it("writes the cookie and mirrors it to localStorage", () => {
    writeTheme("dark");

    expect(written).toHaveLength(1);
    expect(written[0]).toContain(`${THEME_COOKIE}=dark`);
    expect(written[0]).toContain("path=/");
    expect(written[0]).toContain("SameSite=Lax");
    // A year: long enough that the choice feels permanent.
    expect(written[0]).toContain(`max-age=${60 * 60 * 24 * 365}`);
    // The audit script drives themes through storage, so the mirror is not
    // belt-and-braces.
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("sets no domain on localhost, where cookies ignore the port anyway", () => {
    writeTheme("light");
    expect(written[0]).not.toContain("domain=");
  });

  it("sets no domain on a preview origin it does not own", () => {
    vi.stubGlobal("location", { hostname: "oxygen-git-abc123.vercel.app" });
    writeTheme("dark");
    // Writing a cookie for a domain you do not own is a cookie the browser
    // drops; the empty branch is the honest one.
    expect(written[0]).not.toContain("domain=");
  });

  it("scopes to the registrable domain on the apex", () => {
    vi.stubGlobal("location", { hostname: "oxygenui.design" });
    writeTheme("dark");
    expect(written[0]).toContain("domain=.oxygenui.design");
  });

  it("scopes to the registrable domain on the app subdomain", () => {
    vi.stubGlobal("location", { hostname: "app.oxygenui.design" });
    writeTheme("light");
    // This is the whole reason it is a cookie: the choice has to reach the
    // other origin.
    expect(written[0]).toContain("domain=.oxygenui.design");
  });

  it("does not scope to a domain that merely ends in the same letters", () => {
    vi.stubGlobal("location", { hostname: "notoxygenui.design" });
    writeTheme("dark");
    expect(written[0]).not.toContain("domain=");
  });

  it("survives a browser that refuses storage", () => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      set: () => {
        throw new Error("blocked");
      },
      get: () => "",
    });

    // The class is still applied by the caller; this must not throw past it.
    expect(() => writeTheme("dark")).not.toThrow();
  });

  it("round-trips through readStoredTheme", () => {
    writeTheme("dark");
    expect(readStoredTheme()).toBe("dark");
  });
});

/* ------------------------------------------------------------------ */
/* The pre-paint script                                                */
/* ------------------------------------------------------------------ */

describe("THEME_BOOT_SCRIPT", () => {
  /**
   * Evaluated rather than string-matched.
   *
   * It is a string because it has to run before any bundle is fetched, which
   * also means no compiler ever checks it: a typo in it is a white flash on
   * every load for every dark reader, and nothing else would notice. Running
   * it is the only way to know it works.
   */
  const boot = () => {
    // The point of the test is that this exact string executes correctly;
    // importing an equivalent would test something else.
    eval(THEME_BOOT_SCRIPT);
  };

  it("applies dark from the cookie", () => {
    cookieJar = `${THEME_COOKIE}=dark`;
    boot();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applies light from the cookie over a dark machine", () => {
    stubMatchMedia(true);
    cookieJar = `${THEME_COOKIE}=light`;
    boot();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("reads the legacy storage keys, exactly as the module does", () => {
    localStorage.setItem("oxygen-console-theme", "dark");
    boot();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("sets the high-contrast attribute and stops", () => {
    cookieJar = `${THEME_COOKIE}=high-contrast`;
    boot();
    expect(document.documentElement.getAttribute("data-ox-theme")).toBe("high-contrast");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("follows the machine when nothing is stored", () => {
    stubMatchMedia(true);
    boot();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("swallows a storage error rather than blocking first paint", () => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      },
    });
    expect(boot).not.toThrow();
  });

  it("agrees with the module it duplicates", () => {
    // The script and `readStoredTheme` + `resolveTheme` + `applyTheme` are the
    // same decision written twice, once for before the bundle and once for
    // after. They have to agree, or the page repaints on hydration.
    for (const stored of ["dark", "light", "high-contrast"] as const) {
      cookieJar = `${THEME_COOKIE}=${stored}`;
      document.documentElement.className = "";
      document.documentElement.removeAttribute("data-ox-theme");
      boot();
      const fromScript = {
        dark: document.documentElement.classList.contains("dark"),
        attr: document.documentElement.getAttribute("data-ox-theme"),
      };

      document.documentElement.className = "";
      document.documentElement.removeAttribute("data-ox-theme");
      applyTheme(resolveTheme(readStoredTheme()));
      expect({
        dark: document.documentElement.classList.contains("dark"),
        attr: document.documentElement.getAttribute("data-ox-theme"),
      }).toEqual(fromScript);
    }
  });
});
