import { ApiError } from "@myanodex/shared/api-client";
import { session } from "@/mocks/fixtures";

type Context = {
  params: Record<string, string>;
  request: { url: string; json: () => Promise<any> };
};
type Resolver = (
  context: Context,
) => LocalResponse<any> | Promise<LocalResponse<any>>;
export class LocalResponse<T = unknown> {
  constructor(
    public body: T,
    public options: { status?: number } = {},
  ) {}
  static json<T>(body: T, options: { status?: number } = {}) {
    return new LocalResponse(body, options);
  }
}
const route = (method: string) => (pattern: string, resolve: Resolver) => ({
  method,
  pattern,
  resolve,
});
const persistence: { load: () => void; save: () => void }[] = [];
export function registerLocalPersistence(store: {
  load: () => void;
  save: () => void;
}) {
  persistence.push(store);
}
export const local = {
  get: route("GET"),
  post: route("POST"),
  put: route("PUT"),
  patch: route("PATCH"),
  delete: route("DELETE"),
};
export async function resolveLocal<T>(
  routes: ReturnType<ReturnType<typeof route>>[],
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  persistence.forEach((store) => store.load());
  const url = new URL(path, "http://demo.local");
  if (
    url.pathname.startsWith("/api/v1/doctor/appointments") &&
    !session.plan?.isPro
  )
    throw new ApiError(403, "Appointments require a Pro subscription.");
  for (const handler of routes) {
    if (handler.method !== method) continue;
    const keys: string[] = [];
    const pattern = handler.pattern
      .replace(/^\*/, "")
      .replace(/:([^/]+)/g, (_, key) => {
        keys.push(key);
        return "([^/]+)";
      });
    const match = url.pathname.match(new RegExp(`^${pattern}$`));
    if (!match) continue;
    const params = Object.fromEntries(
      keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]),
    );
    const value =
      body instanceof FormData ? Object.fromEntries(body.entries()) : body;
    const response = await handler.resolve({
      params,
      request: { url: url.href, json: async () => value },
    });
    if ((response.options.status ?? 200) >= 400)
      throw new ApiError(
        response.options.status!,
        (response.body as { message: string }).message,
        response.body,
      );
    if (method !== "GET") persistence.forEach((store) => store.save());
    return structuredClone(response.body) as T;
  }
  throw new Error(`Missing demo data: ${method} ${url.pathname}`);
}
