declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    OPENROUTER_API_KEY?: string;
    OPENROUTER_MODEL?: string;
    OPENROUTER_REASONING_EFFORT?: string;
    OPENROUTER_EMBEDDING_MODEL?: string;
    OPENROUTER_BASE_URL?: string;
    OPENROUTER_SITE_URL?: string;
    OPENROUTER_APP_NAME?: string;
  }
}
