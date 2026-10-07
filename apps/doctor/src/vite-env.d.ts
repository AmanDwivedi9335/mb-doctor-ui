/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin for a deployed build (https://api.medibank.in). Empty = same origin (vite proxy). */
  readonly VITE_API_ORIGIN?: string;
  /** "true" turns the MSW mock layer on. Off by default. */
  readonly VITE_ENABLE_MOCKS?: string;
  /** Dev only: where the vite proxy forwards /api. */
  readonly VITE_BACKEND_ORIGIN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
