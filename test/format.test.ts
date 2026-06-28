import { describe, it, expect } from "vitest";
import chalk from "chalk";
import { InvalidArgumentError } from "commander";

// Disable ANSI colors so assertions are on plain text.
chalk.level = 0;

import {
  stripHtml,
  parseIntArg,
  formatReference,
  formatVerse,
  formatBibles,
  formatBooks,
  formatTags,
} from "../src/format.js";

describe("stripHtml", () => {
  it("removes tags and superscript verse numbers", () => {
    const html = '<p><sup data-verse="16">16</sup>For God so loved the world</p>';
    expect(stripHtml(html)).toBe("16 For God so loved the world");
  });

  it("decodes common HTML entities", () => {
    expect(stripHtml("Faith &amp; works &#39;together&#39;")).toBe("Faith & works 'together'");
  });

  it("collapses whitespace and trims", () => {
    expect(stripHtml("  hello   \n\n\n  world  ")).toBe("hello\n\nworld");
  });
});

describe("parseIntArg", () => {
  it("parses integers", () => {
    expect(parseIntArg("42")).toBe(42);
  });

  it("throws InvalidArgumentError on non-numbers", () => {
    expect(() => parseIntArg("abc")).toThrow(InvalidArgumentError);
  });
});

describe("formatReference", () => {
  it("formats a whole chapter", () => {
    expect(formatReference("Genesis", 1)).toBe("Genesis 1");
  });

  it("formats a single verse", () => {
    expect(formatReference("John", 3, 16)).toBe("John 3:16");
  });

  it("formats a verse range", () => {
    expect(formatReference("John", 3, 16, 18)).toBe("John 3:16-18");
  });

  it("collapses a range whose start equals its end", () => {
    expect(formatReference("John", 3, 16, 16)).toBe("John 3:16");
  });
});

describe("formatVerse", () => {
  it("renders the reference and stripped content", () => {
    const out = formatVerse({
      verse: {
        book: "John",
        chapter: 3,
        startVerse: 16,
        endVerse: 16,
        bibleId: "esv",
        content: "<sup>16</sup>For God so loved the world",
        isFavorite: true,
      },
    });
    expect(out).toContain("John 3:16");
    expect(out).toContain("For God so loved the world");
    expect(out).toContain("esv");
  });

  it("handles an empty response", () => {
    expect(formatVerse({})).toContain("No verse");
  });
});

describe("list formatters", () => {
  it("formats bibles", () => {
    const out = formatBibles({
      bibles: [{ id: "esv", name: "English Standard Version", abbreviation: "esv", source: "api.bible" }],
    });
    expect(out).toContain("esv");
    expect(out).toContain("English Standard Version");
  });

  it("formats books", () => {
    const out = formatBooks({ books: [{ name: "Genesis", code: "GEN", chapters: 50 }] });
    expect(out).toContain("GEN");
    expect(out).toContain("Genesis");
    expect(out).toContain("50");
  });

  it("formats tags", () => {
    const out = formatTags({ tags: [{ id: 1, name: "faith" }, { id: 2, name: "hope" }] });
    expect(out).toContain("#faith");
    expect(out).toContain("#hope");
  });

  it("handles empty lists", () => {
    expect(formatBibles({})).toContain("No Bibles");
    expect(formatBooks({})).toContain("No books");
    expect(formatTags({})).toContain("No tags");
  });
});
