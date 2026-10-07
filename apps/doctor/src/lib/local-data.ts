import { ApiError } from "@myanodex/shared/api-client";

type Context = { params: Record<string, string>; request: { url: string; json: () => Promise<any> } };
type Resolver = (context: Context) => LocalResponse<any> | Promise<LocalResponse<any>>;
export class LocalResponse<T = unknown> {
  constructor(public body: T, public options: { status?: number } = {}) {}
  static json<T>(body: T, options: { status?: number } = {}) { return new LocalResponse(body, options); }
}
const route = (method: string) => (pattern: string, resolve: Resolver) => ({ method, pattern, resolve });
export const local = { get: route("GET"), post: route("POST"), put: route("PUT"), patch: route("PATCH"), delete: route("DELETE") };
export async function resolveLocal<T>(routes: ReturnType<ReturnType<typeof route>>[], method: string, path: string, body?: unknown): Promise<T> {
  const url = new URL(path, "http://demo.local");
  for (const handler of routes) {
    if (handler.method !== method) continue;
    const keys: string[] = [];
    const pattern = handler.pattern.replace(/^\*/, "").replace(/:([^/]+)/g, (_, key) => { keys.push(key); return "([^/]+)"; });
    const match = url.pathname.match(new RegExp(`^${pattern}$`));
    if (!match) continue;
    const params = Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
    const value = body instanceof FormData ? Object.fromEntries(body.entries()) : body;
    const response = await handler.resolve({ params, request: { url: url.href, json: async () => value } });
    if ((response.options.status ?? 200) >= 400) throw new ApiError(response.options.status!, (response.body as { message: string }).message, response.body);
    return structuredClone(response.body) as T;
  }
  throw new Error(`Missing demo data: ${method} ${url.pathname}`);
}
