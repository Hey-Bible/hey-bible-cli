import chalk from "chalk";
import { InvalidArgumentError } from "commander";
import type {
  BiblesGet200Response,
  BooksGet200Response,
  SearchGet200Response,
  TagsGet200Response,
} from "@hey-bible/client";

/**
 * Verse content comes back from the API as HTML (with `<sup>` verse numbers).
 * Strip it down to plain text suitable for a terminal.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<sup[^>]*>/gi, " ")
    .replace(/<\/sup>/gi, " ")
    .replace(/<\/(p|div|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Commander coercion for integer options/arguments.
 *
 * Every numeric input this CLI takes (chapter, verse numbers, limit, offset,
 * id) is a non-negative integer, so reject anything else up front with a clear
 * message rather than sending a bad value to the API.
 */
export function parseIntArg(value: string): number {
  if (!/^\d+$/.test(value.trim())) {
    throw new InvalidArgumentError("Expected a non-negative integer.");
  }
  return Number.parseInt(value.trim(), 10);
}

/** Build a human-readable reference like "John 3:16-18" or "Genesis 1". */
export function formatReference(
  book?: string,
  chapter?: number,
  startVerse?: number,
  endVerse?: number,
): string {
  let ref = `${book ?? "?"} ${chapter ?? "?"}`;
  if (startVerse != null) {
    ref += `:${startVerse}`;
    if (endVerse != null && endVerse !== startVerse) {
      ref += `-${endVerse}`;
    }
  }
  return ref;
}

export function formatVerse(res: SearchGet200Response): string {
  const v = res.verse;
  if (!v) {
    return chalk.yellow("No verse returned.");
  }
  const ref = formatReference(v.book, v.chapter, v.startVerse, v.endVerse);
  const heading = chalk.bold.cyan(ref) + (v.bibleId ? chalk.dim(`  (${v.bibleId})`) : "");
  const star = v.isFavorite ? chalk.yellow(" ★") : "";
  return `${heading}${star}\n\n${stripHtml(v.content ?? "")}`;
}

export function formatBibles(res: BiblesGet200Response): string {
  const bibles = res.bibles ?? [];
  if (bibles.length === 0) {
    return chalk.yellow("No Bibles found.");
  }
  return bibles
    .map((b) => {
      const id = chalk.bold(b.id ?? "?");
      const abbr = b.abbreviation ? chalk.cyan(b.abbreviation.toUpperCase()) : "";
      const src = b.source ? chalk.dim(`[${b.source}]`) : "";
      return `${id}  ${abbr}  ${b.name ?? ""} ${src}`.trimEnd();
    })
    .join("\n");
}

export function formatBooks(res: BooksGet200Response): string {
  const books = res.books ?? [];
  if (books.length === 0) {
    return chalk.yellow("No books found.");
  }
  return books
    .map((b) => {
      const code = chalk.cyan((b.code ?? "?").padEnd(4));
      const name = (b.name ?? "").padEnd(22);
      const chapters = chalk.dim(`${b.chapters ?? "?"} ch`);
      return `${code} ${name} ${chapters}`;
    })
    .join("\n");
}

export function formatTags(res: TagsGet200Response): string {
  const tags = res.tags ?? [];
  if (tags.length === 0) {
    return chalk.yellow("No tags found.");
  }
  return tags.map((t) => `${chalk.bold("#" + (t.name ?? "?"))}`).join("  ");
}

function renderScalar(value: unknown): string {
  if (value === null || value === undefined) return chalk.dim("—");
  if (typeof value === "string") {
    // Strip HTML so verse content (and any other HTML field) reads cleanly.
    return /<[^>]+>/.test(value) ? stripHtml(value) : value;
  }
  return String(value);
}

/**
 * Generic human-readable renderer (YAML-ish) used as the default for the
 * richer, deeply-nested responses (favorites, notes, images, chats) that don't
 * have a bespoke formatter. Keeps every command human-readable by default, with
 * `--json` always available for the raw structure.
 */
export function renderHuman(data: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (data === null || data === undefined) return `${pad}${chalk.dim("(none)")}`;
  if (Array.isArray(data)) {
    if (data.length === 0) return `${pad}${chalk.dim("(empty)")}`;
    return data
      .map((item) =>
        item !== null && typeof item === "object"
          ? `${pad}${chalk.dim("-")}\n${renderHuman(item, indent + 1)}`
          : `${pad}${chalk.dim("-")} ${renderScalar(item)}`,
      )
      .join("\n");
  }
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return `${pad}${chalk.dim("(empty)")}`;
    return entries
      .map(([k, v]) =>
        v !== null && typeof v === "object"
          ? `${pad}${chalk.bold(k)}:\n${renderHuman(v, indent + 1)}`
          : `${pad}${chalk.bold(k)}: ${renderScalar(v)}`,
      )
      .join("\n");
  }
  return `${pad}${renderScalar(data)}`;
}

/**
 * Print an API result. With `json: true`, emit raw pretty JSON (stable for
 * scripting and AI agents). Otherwise use the command's bespoke formatter, or
 * fall back to the generic human renderer so every command is readable.
 */
export function printResult(
  data: unknown,
  json: boolean,
  formatter?: (data: any) => string,
): void {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  console.log(formatter ? formatter(data) : renderHuman(data));
}
