import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import chalk from "chalk";

chalk.level = 0;

// Hoisted shared state so the mock factory can safely reference it.
const h = vi.hoisted(() => {
  const calls: Record<string, unknown> = {};
  const fixtures = {
    bibles: { bibles: [{ id: "esv", name: "English Standard Version", abbreviation: "esv", source: "api.bible" }] },
    books: { books: [{ name: "Genesis", code: "GEN", chapters: 50 }] },
    search: {
      verse: { book: "John", chapter: 3, startVerse: 16, endVerse: 18, bibleId: "esv", content: "<sup>16</sup>For God so loved the world" },
    },
    tags: { tags: [{ id: 1, name: "faith" }] },
    favorites: { favorites: [] },
    notes: { notes: [] },
    images: { images: [] },
    chats: { chats: [] },
  };
  return { calls, fixtures };
});

vi.mock("@hey-bible/client", () => {
  return {
    Configuration: class {
      constructor(public params: Record<string, unknown>) {}
    },
    HeyBibleApi: class {
      constructor(public config: unknown) {}
      async biblesGet() {
        h.calls.biblesGet = true;
        return h.fixtures.bibles;
      }
      async booksGet() {
        h.calls.booksGet = true;
        return h.fixtures.books;
      }
      async searchGet(req: unknown) {
        h.calls.searchGet = req;
        return h.fixtures.search;
      }
      async favoritesGet(req: unknown) {
        h.calls.favoritesGet = req;
        return h.fixtures.favorites;
      }
      async notesGet(req: unknown) {
        h.calls.notesGet = req;
        return h.fixtures.notes;
      }
      async imagesGet(req: unknown) {
        h.calls.imagesGet = req;
        return h.fixtures.images;
      }
      async chatsGet(req: unknown) {
        h.calls.chatsGet = req;
        return h.fixtures.chats;
      }
      async tagsGet() {
        h.calls.tagsGet = true;
        return h.fixtures.tags;
      }
    },
  };
});

// Imported after the mock is declared (vi.mock is hoisted above imports anyway).
import { buildProgram } from "../src/program.js";

let out: string[];
let err: string[];

async function cli(...args: string[]): Promise<void> {
  await buildProgram().parseAsync(["node", "hey-bible", ...args]);
}

beforeEach(() => {
  out = [];
  err = [];
  vi.spyOn(console, "log").mockImplementation((m?: unknown) => {
    out.push(String(m));
  });
  vi.spyOn(console, "error").mockImplementation((m?: unknown) => {
    err.push(String(m));
  });
  for (const k of Object.keys(h.calls)) delete h.calls[k];
  process.env.HEY_BIBLE_API_KEY = "test-key";
  process.exitCode = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe("hey-bible CLI", () => {
  it("books --json prints the raw API response", async () => {
    await cli("books", "--json");
    expect(h.calls.booksGet).toBe(true);
    expect(JSON.parse(out.join("\n"))).toEqual(h.fixtures.books);
  });

  it("books (human) prints a readable table", async () => {
    await cli("books");
    const text = out.join("\n");
    expect(text).toContain("GEN");
    expect(text).toContain("Genesis");
  });

  it("bibles calls biblesGet", async () => {
    await cli("bibles", "--json");
    expect(h.calls.biblesGet).toBe(true);
  });

  it("tags calls tagsGet", async () => {
    await cli("tags");
    expect(h.calls.tagsGet).toBe(true);
    expect(out.join("\n")).toContain("#faith");
  });

  it("search coerces the chapter to a number and forwards verse options", async () => {
    await cli("search", "John", "3", "--start-verse", "16", "--end-verse", "18", "--bible-id", "esv", "--json");
    expect(h.calls.searchGet).toEqual({
      book: "John",
      chapter: 3,
      startVerse: 16,
      endVerse: 18,
      bibleId: "esv",
    });
  });

  it("search (human) renders the verse", async () => {
    await cli("search", "John", "3");
    const text = out.join("\n");
    expect(text).toContain("John 3");
    expect(text).toContain("For God so loved the world");
  });

  it("favorites forwards tag/limit/offset", async () => {
    await cli("favorites", "--tag", "faith", "--limit", "5", "--offset", "10", "--json");
    expect(h.calls.favoritesGet).toEqual({ tag: "faith", limit: 5, offset: 10 });
  });

  it("notes coerces numeric id/limit/offset", async () => {
    await cli("notes", "--id", "7", "--json");
    expect(h.calls.notesGet).toEqual({ id: 7, limit: undefined, offset: undefined });
  });

  it("accepts --api-key as a flag", async () => {
    delete process.env.HEY_BIBLE_API_KEY;
    await cli("books", "--api-key", "flag-key", "--json");
    expect(h.calls.booksGet).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  it("errors clearly when no API key is available", async () => {
    delete process.env.HEY_BIBLE_API_KEY;
    await cli("books");
    expect(h.calls.booksGet).toBeUndefined();
    expect(process.exitCode).toBe(1);
    expect(err.join("\n")).toMatch(/API key/i);
  });
});
