export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface ApiClientConfig {
  baseURL?: string;
  getToken?: () => string | null;
  /**
   * Extra headers evaluated per request, not captured once at construction.
   * The patient app uses this for `X-Acting-For` — which member's data the
   * request is about — and that changes while the client lives.
   */
  getHeaders?: () => Record<string, string>;
}

/**
 * `AbortSignal.timeout` is Chrome 103+ / Safari 16+ (both mid-2022). Older
 * phone browsers throw "AbortSignal.timeout is not a function" on every
 * request, which killed the whole app rather than just the timeout. Fall back
 * to the AbortController the same browsers have had for years.
 */
function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export function createApiClient(config: ApiClientConfig = {}) {
  const baseURL = config.baseURL || '/api/v1';

  async function request<T>(path: string, options: RequestInit = {}, timeoutMs = 30_000): Promise<T> {
    const token = config.getToken?.();
    const headers: Record<string, string> = {
      ...config.getHeaders?.(),
      // Per-call headers win: a caller that set one explicitly meant it.
      ...(options.headers as Record<string, string>),
    };
    // Only JSON-serialized (string) bodies get a JSON content-type. FormData
    // uploads must be left untouched so the browser sets
    // `multipart/form-data; boundary=…` itself — forcing application/json here
    // mislabels the multipart bytes and trips Fastify's content-length check
    // (FST_ERR_CTP_INVALID_CONTENT_LENGTH).
    if (typeof options.body === 'string') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseURL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      // A stalled backend must surface as an error, not an infinite spinner.
      signal: options.signal ?? timeoutSignal(timeoutMs),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new ApiError(response.status, error.message || 'Request failed', error);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  return {
    get: <T>(path: string) => request<T>(path),

    post: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),

    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),

    put: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),

    delete: <T>(path: string) =>
      request<T>(path, { method: 'DELETE' }),

    upload: <T>(path: string, formData: FormData) =>
      // Large files (voice recordings) on slow clinic links need longer than
      // the default request timeout.
      request<T>(path, {
        method: 'POST',
        body: formData,
        headers: {},
      }, 120_000),
  };
}
