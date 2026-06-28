<p align="center">
  <img alt="Hey Bible" src="assets/og-image.png" width="1200" />
</p>

# @hey-bible/cli

> Give your terminal — and your AI agents — access to the Bible.

The Hey Bible command-line interface. A thin, scriptable wrapper over the
[`@hey-bible/client`](https://www.npmjs.com/package/@hey-bible/client) SDK that
lets you look up Scripture, browse translations, and read your saved Hey Bible
data straight from the shell. Every command supports `--json`, so it doubles as
a clean, structured **gateway for AI agents**.

Part of the Hey Bible developer platform — alongside the
[REST API](https://docs.heybible.app), the
[`@hey-bible/mcp`](https://www.npmjs.com/package/@hey-bible/mcp) server, and the
[`@hey-bible/client`](https://www.npmjs.com/package/@hey-bible/client) SDK.

## Installation

```bash
npm install -g @hey-bible/cli
```

Or run it on demand with `npx` (no install required):

```bash
npx -y @hey-bible/cli search John 3
```

## Configuration

Set your Hey Bible API key as an environment variable:

```bash
export HEY_BIBLE_API_KEY=your_api_key_here
```

You can also pass it per-command with `--api-key`. Get your key from
[Hey Bible](https://heybible.app) under **Account > API Keys**.

| Variable | Description |
|----------|-------------|
| `HEY_BIBLE_API_KEY` | Your API key (required). |
| `HEY_BIBLE_API_URL` | Override the API base URL (defaults to `https://api.heybible.app`). |

## Quick start

```bash
# Look up a verse range
hey-bible search John 3 --start-verse 16 --end-verse 18

# List available translations and books
hey-bible bibles
hey-bible books

# Get raw JSON for scripting or AI agents
hey-bible search "1 Corinthians" 13 --json
```

## Commands

| Command | Description |
|---------|-------------|
| `bibles` | List available Bible translations. |
| `books` | List the 66 books with their 3-letter codes and chapter counts. |
| `search <book> <chapter>` | Look up verses. Saves the lookup to your account. |
| `favorites` | List favorited verses with notes, images, conversations, and tags. |
| `notes` | List your verse notes. |
| `images` | List AI-generated verse images (use `--id` for a signed URL). |
| `chats` | List chat conversations with verse context. |
| `tags` | List the tags you use to organize favorites. |

### `search` options

| Flag | Description |
|------|-------------|
| `-s, --start-verse <n>` | Starting verse number. |
| `-e, --end-verse <n>` | Ending verse number. |
| `-b, --bible-id <id>` | Translation ID (defaults to ESV; see `hey-bible bibles`). |

### Global options

| Flag | Description |
|------|-------------|
| `--json` | Output raw JSON (recommended for scripts and AI agents). |
| `--api-key <key>` | API key (or set `HEY_BIBLE_API_KEY`). |
| `--api-url <url>` | Override the API base URL (or set `HEY_BIBLE_API_URL`). |
| `-v, --version` | Print the version. |
| `-h, --help` | Show help for any command. |

List endpoints (`favorites`, `notes`, `images`, `chats`) accept
`-l, --limit <n>` and `-o, --offset <n>` for pagination, and `notes`/`images`/
`chats` accept `-i, --id` to fetch a single record.

## For AI agents

Pair the CLI with the [`hey-bible` Agent Skill](./skills/hey-bible) (published to
[ClawHub](https://clawhub.ai)) to give any OpenClaw-compatible agent first-class
access to Scripture. The skill calls this CLI under the hood:

```bash
npx -y @hey-bible/cli search John 3 --json
```

Because every command emits structured JSON with `--json`, the output is trivial
for an LLM to parse and reason over.

## Development

```bash
# Install dependencies
npm install

# Run the CLI from source
npm run dev -- search John 3

# Run tests
npm test

# Build
npm run build
```

## Releasing

Releases are automated via GitHub Actions. Pushing a `v*` tag will run the tests,
build, create a GitHub release, and publish to npm with the version from the tag.

```bash
git tag v1.0.0
git push origin main --tags
```

You'll need an `NPM_TOKEN` secret configured in the repository settings.

## License

MIT © Working Dev's Hero LLC
