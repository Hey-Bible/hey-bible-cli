/**
 * Hey Bible CLI program definition.
 *
 * A thin command-line wrapper over the @hey-bible/client SDK. Kept separate
 * from the bin entry point (index.ts) so tests can import `buildProgram`
 * without triggering argv parsing.
 */

import { createRequire } from "node:module";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import type { HeyBibleApi } from "@hey-bible/client";
import { createApi } from "./client.js";
import {
  formatBibles,
  formatBooks,
  formatTags,
  formatVerse,
  parseIntArg,
  parseLimit,
  printResult,
} from "./format.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

/**
 * Shared execution path: resolve the client from global options, run the
 * fetcher, and print the result. Errors go to stderr and set a non-zero exit
 * code (without killing the process, so the CLI stays testable).
 */
async function run<T>(
  command: Command,
  fetcher: (api: HeyBibleApi) => Promise<T>,
  formatter?: (data: T) => string,
): Promise<void> {
  const opts = command.optsWithGlobals();
  const spinner =
    process.stderr.isTTY && !opts.json
      ? ora({ text: "Talking to Hey Bible…", stream: process.stderr }).start()
      : null;
  try {
    const api = createApi({ apiKey: opts.apiKey, apiUrl: opts.apiUrl });
    const data = await fetcher(api);
    spinner?.stop();
    printResult(data, Boolean(opts.json), formatter as ((d: unknown) => string) | undefined);
  } catch (err) {
    spinner?.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`Error: ${message}`));
    process.exitCode = 1;
  }
}

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("hey-bible")
    .description(
      "Hey Bible CLI — the one-stop gateway for giving your terminal and AI agents access to the Bible.",
    )
    .version(pkg.version, "-v, --version")
    .option("--api-key <key>", "Hey Bible API key (or set HEY_BIBLE_API_KEY)")
    .option("--api-url <url>", "Override the API base URL (or set HEY_BIBLE_API_URL)")
    .option("--json", "Output raw JSON (recommended for scripts and AI agents)")
    .showHelpAfterError()
    // Throw a CommanderError instead of calling process.exit() directly, so the
    // entry point owns the exit code and tests can assert on parse failures.
    .exitOverride();

  program
    .command("bibles")
    .description("List available Bible translations")
    .action((_opts, command: Command) => run(command, (api) => api.biblesGet(), formatBibles));

  program
    .command("books")
    .description("List the 66 books of the Bible with codes and chapter counts")
    .action((_opts, command: Command) => run(command, (api) => api.booksGet(), formatBooks));

  program
    .command("search")
    .description("Look up verses by book and chapter (saves the lookup to your account)")
    .argument("<book>", 'Book name (e.g. "John", "Genesis", "1 Corinthians")')
    .argument("<chapter>", "Chapter number", parseIntArg)
    .option("-s, --start-verse <n>", "Starting verse number", parseIntArg)
    .option("-e, --end-verse <n>", "Ending verse number", parseIntArg)
    .option("-b, --bible-id <id>", "Bible translation ID (defaults to ESV; see `bibles`)")
    .action((book: string, chapter: number, options, command: Command) =>
      run(
        command,
        (api) =>
          api.searchGet({
            book,
            chapter,
            startVerse: options.startVerse,
            endVerse: options.endVerse,
            bibleId: options.bibleId,
          }),
        formatVerse,
      ),
    );

  program
    .command("favorites")
    .description("List your favorited verses with notes, images, conversations, and tags")
    .option("-t, --tag <tag>", "Filter favorites by tag name")
    .option("-l, --limit <n>", "Number to return (1-100)", parseLimit)
    .option("-o, --offset <n>", "Number to skip for pagination", parseIntArg)
    .action((options, command: Command) =>
      run(command, (api) =>
        api.favoritesGet({ tag: options.tag, limit: options.limit, offset: options.offset }),
      ),
    );

  program
    .command("notes")
    .description("List your verse notes")
    .option("-i, --id <n>", "Specific note ID to retrieve", parseIntArg)
    .option("-l, --limit <n>", "Number to return (1-100)", parseLimit)
    .option("-o, --offset <n>", "Number to skip for pagination", parseIntArg)
    .action((options, command: Command) =>
      run(command, (api) =>
        api.notesGet({ id: options.id, limit: options.limit, offset: options.offset }),
      ),
    );

  program
    .command("images")
    .description("List your AI-generated verse images (use --id for a signed URL)")
    .option("-i, --id <n>", "Specific image ID to retrieve (returns a 24h signed URL)", parseIntArg)
    .option("-l, --limit <n>", "Number to return (1-100)", parseLimit)
    .option("-o, --offset <n>", "Number to skip for pagination", parseIntArg)
    .action((options, command: Command) =>
      run(command, (api) =>
        api.imagesGet({ id: options.id, limit: options.limit, offset: options.offset }),
      ),
    );

  program
    .command("chats")
    .description("List your chat conversations with verse context")
    .option("-i, --id <uuid>", "Specific chat ID (UUID) to retrieve with messages")
    .option("-l, --limit <n>", "Number to return (1-100)", parseLimit)
    .option("-o, --offset <n>", "Number to skip for pagination", parseIntArg)
    .action((options, command: Command) =>
      run(command, (api) =>
        api.chatsGet({ id: options.id, limit: options.limit, offset: options.offset }),
      ),
    );

  program
    .command("tags")
    .description("List the tags you use to organize favorites")
    .action((_opts, command: Command) => run(command, (api) => api.tagsGet(), formatTags));

  return program;
}
