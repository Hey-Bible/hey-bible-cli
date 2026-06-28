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
    .replace(/<br\s*\/?>(?=)/gi, "\n")
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

/** Commander coercion: parse an integer option/argument or throw a friendly error. */
export function parseIntArg(value: string): number {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) {
    throw new InvalidArgumentError("Expected an integer.");
  }
  return n;
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

/**
 * Print an API result. With `json: true`, always emit pretty JSON (stable for
 * scripting and AI agents). Otherwise emit a formatter-specific human view,
 * falling back to pretty JSON for the rich nested user-data responses.
 */
export function printResult(
  data: unknown,
  json: boolean,
  formatter?: (data: any) => string,
): void {
  if (json || !formatter) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  console.log(formatter(data));
}
