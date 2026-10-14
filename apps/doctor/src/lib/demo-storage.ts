/** Browser persistence for this offline demo; contains no passwords or real tokens. */
export const DEMO_STORAGE_PREFIX = "medibank-demo:v2:";

export function readDemoState<T>(key: string, fallback: T): T {
  try {
    const value =
      typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(DEMO_STORAGE_PREFIX + key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeDemoState(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEMO_STORAGE_PREFIX + key, JSON.stringify(value));
}

export const SESSION_GENERATION_KEY = "medibank-demo:session-generation";
const defaultAccount = "6a1b6721c40e0c471b4f5aad";
export function sessionAccount() {
  return typeof sessionStorage === "undefined"
    ? defaultAccount
    : (sessionStorage.getItem("medibank-demo:account") ?? defaultAccount);
}
export function sessionGeneration() {
  try {
    return typeof localStorage === "undefined"
      ? "0"
      : ((
          JSON.parse(
            localStorage.getItem(SESSION_GENERATION_KEY) ?? "{}",
          ) as Record<string, string>
        )[sessionAccount()] ?? "0");
  } catch {
    return "0";
  }
}
export function adoptDemoSession() {
  sessionStorage.setItem("doctor-mock-session", "1");
  sessionStorage.setItem(SESSION_GENERATION_KEY, sessionGeneration());
}
export function hasDemoSession() {
  try {
    if (sessionStorage.getItem("doctor-mock-session") === "0") return false;
    const generation = sessionGeneration();
    const adopted = sessionStorage.getItem(SESSION_GENERATION_KEY);
    // A fresh demo starts signed in; after revocation every new or sleeping tab must sign in.
    return adopted === generation || (adopted === null && generation === "0");
  } catch {
    return false;
  }
}
export function revokeDemoSessions() {
  const generation = crypto.randomUUID();
  if (typeof localStorage !== "undefined") {
    const generations = JSON.parse(
      localStorage.getItem(SESSION_GENERATION_KEY) ?? "{}",
    ) as Record<string, string>;
    generations[sessionAccount()] = generation;
    localStorage.setItem(SESSION_GENERATION_KEY, JSON.stringify(generations));
  }
  sessionStorage.setItem("doctor-mock-session", "0");
}
