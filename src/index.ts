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

import { buildProgram } from "./program.js";

buildProgram().parseAsync(process.argv);
