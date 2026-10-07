/**
 * Start MSW only when explicitly asked (VITE_ENABLE_MOCKS=true). The default,
 * in dev and in production builds, is the real backend: the vite proxy in dev
 * (see vite.config.ts), VITE_API_ORIGIN in a deployed build.
 *
 * msw and the handlers are imported lazily so the real-backend build never
 * evaluates them: a broken fixture must not be able to blank the portal.
 */
export async function startMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== "true") return;
  const [{ setupWorker }, { handlers }] = await Promise.all([import("msw/browser"), import("./handlers")]);
  await setupWorker(...handlers).start({
    onUnhandledRequest: "bypass", // let vite assets and fonts through untouched
    quiet: true,
  });
}
