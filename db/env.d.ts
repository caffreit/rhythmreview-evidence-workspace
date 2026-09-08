declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    OPENAI_EMBEDDING_MODEL?: string;
  }
}
