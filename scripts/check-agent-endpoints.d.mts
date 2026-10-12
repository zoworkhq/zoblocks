/** Types for check-agent-endpoints.mjs, which stays plain JS so the deploy job can run it without an install. */

export interface Finding {
  name: string;
  ok: boolean;
  detail: string;
}

export const EXPECTED_TOOLS: string[];
export function supportedSchemaVersion(): number;
export function registryComponents(): string[];
export function rpcResult(text: string): Record<string, unknown>;
export function checkEndpoints(options: {
  base: string;
  fetchImpl?: (input: URL | string, init?: RequestInit) => Promise<Response>;
  schemaVersion?: number;
  components?: string[];
}): Promise<Finding[]>;
