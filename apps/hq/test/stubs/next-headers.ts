/**
 * Stand-in for `next/headers`.
 *
 * The real module only works inside a request scope, and the code under test —
 * sessions, throttling, the client-address key — reads cookies and headers on
 * nearly every path. Aliased in `vitest.config.ts` so no test needs to mock it.
 *
 * The jar is deliberately a real read/write store rather than a spy: sign-in
 * writes a cookie that `currentUser` must then read back, and asserting on that
 * round trip is most of the point.
 */

let jar = new Map<string, string>();
let requestHeaders = new Headers();

export function __resetHttp(): void {
  jar = new Map();
  requestHeaders = new Headers();
}

export function __setRequestHeader(name: string, value: string): void {
  requestHeaders.set(name, value);
}

export function __readCookie(name: string): string | undefined {
  return jar.get(name);
}

export function __writeCookie(name: string, value: string): void {
  jar.set(name, value);
}

export async function cookies() {
  return {
    get(name: string) {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string) {
      jar.set(name, value);
    },
    delete(name: string) {
      jar.delete(name);
    },
  };
}

export async function headers(): Promise<Headers> {
  return requestHeaders;
}
