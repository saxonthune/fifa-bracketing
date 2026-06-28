/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL of the R2-hosted pinned-brackets JSON. Unset → bundled /pinned.json. */
  readonly VITE_PINNED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
