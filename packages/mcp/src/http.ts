/**
 * The HTTP face: a web-standard `Request → Response` handler for the remote
 * endpoint at zoblocks.design/mcp (ADR 0017).
 *
 * Stateless by construction — every request is answered by a fresh server
 * from the same factory — which is what a serverless function needs, and
 * what the SDK's `createMcpHandler` does for both protocol eras.
 *
 * The SDK's entry point performs no Host or Origin validation and says so;
 * it is the caller's job. So this checks both before the handler sees the
 * request. The data is public either way — the point is that the endpoint
 * answers only as itself, and that a web page in someone's browser cannot
 * make it answer a cross-origin request.
 */

import {
  createMcpHandler,
  hostHeaderValidationResponse,
  localhostAllowedHostnames,
  originValidationResponse,
} from "@modelcontextprotocol/server";
import type { Manifest } from "./manifest.js";
import { createServer } from "./server.js";

export const PUBLIC_HOSTNAMES = ["zoblocks.design", "www.zoblocks.design"];

/** The SDK's own refusal shape, so a client sees one error format whichever check fired. */
function forbidden(message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }),
    {
      status: 403,
      headers: { "content-type": "application/json" },
    },
  );
}

export interface HttpHandlerOptions {
  /** The manifest, or a way to get it — called per request, so it can be cached by the caller. */
  manifest: Manifest | (() => Promise<Manifest>);
  version: string;
  /** Hostnames this deployment answers as, beyond the public ones and localhost — e.g. a preview URL. */
  hostnames?: string[];
}

export function createHttpHandler(
  options: HttpHandlerOptions,
): (request: Request) => Promise<Response> {
  const allowed = [
    ...PUBLIC_HOSTNAMES,
    ...localhostAllowedHostnames(),
    ...(options.hostnames ?? []),
  ];
  const manifest =
    typeof options.manifest === "function"
      ? options.manifest
      : async () => options.manifest as Manifest;

  const handler = createMcpHandler(async () =>
    createServer({ manifest: await manifest(), version: options.version }),
  );

  return async (request) => {
    /*
     * The Host header when there is one — Next.js and every Node server pass
     * it — and the request URL's host when there is not. A runtime that
     * builds the Request from its own URL has no Host header to send (the
     * fetch standard reserves it), but that URL was derived from the Host the
     * client sent, so it is the same fact. Refusing on the missing header
     * would refuse every request such a runtime makes.
     */
    const badHost = request.headers.has("host")
      ? hostHeaderValidationResponse(request, allowed)
      : allowed.includes(new URL(request.url).hostname)
        ? undefined
        : forbidden(`Host ${new URL(request.url).hostname} is not allowed`);
    if (badHost) return badHost;

    // Coding agents send no Origin; a browser always does. Only a browser's is checked.
    if (request.headers.has("origin")) {
      const badOrigin = originValidationResponse(request, allowed);
      if (badOrigin) return badOrigin;
    }

    return handler.fetch(request);
  };
}
