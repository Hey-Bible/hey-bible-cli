#!/usr/bin/env node

/**
 * Hey Bible CLI — bin entry point.
 *
 * Give your terminal — and your AI agents — access to Scripture.
 *
 * @example
 *   hey-bible search John 3 --start-verse 16 --end-verse 18
 *   hey-bible books --json
 */

import { CommanderError } from "commander";
import { buildProgram } from "./program.js";

buildProgram()
  .parseAsync(process.argv)
  .catch((err: unknown) => {
    // Commander uses exitOverride(), so help/version and argument errors arrive
    // here as CommanderError after the relevant output was already written.
    if (err instanceof CommanderError) {
      process.exit(err.exitCode);
    }
    console.error(err);
    process.exit(1);
  });
