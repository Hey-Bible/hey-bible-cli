import { Configuration, HeyBibleApi } from "@hey-bible/client";

export interface ClientOptions {
  /** API key from `--api-key`; falls back to the HEY_BIBLE_API_KEY env var. */
  apiKey?: string;
  /** Base URL override; falls back to the HEY_BIBLE_API_URL env var, then the SDK default. */
  apiUrl?: string;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "A Hey Bible API key is required. Set the HEY_BIBLE_API_KEY environment " +
        "variable or pass --api-key. Get one at https://heybible.app under Account > API Keys.",
    );
    this.name = "MissingApiKeyError";
  }
}

/**
 * Build a configured HeyBibleApi client. Resolves the API key from the
 * `--api-key` flag or the HEY_BIBLE_API_KEY env var, and an optional base URL
 * override from `--api-url` or HEY_BIBLE_API_URL.
 */
export function createApi(options: ClientOptions = {}): HeyBibleApi {
  const apiKey = options.apiKey ?? process.env.HEY_BIBLE_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  const basePath = options.apiUrl ?? process.env.HEY_BIBLE_API_URL;
  return new HeyBibleApi(new Configuration({ apiKey, basePath }));
}
