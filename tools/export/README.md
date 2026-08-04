# archive-export — Eva & Adam

Reads the entire archive out of Supabase and writes a folder you can open
on any laptop, in any decade, with no special software and no internet.

## What it produces

```
eva-and-adam-archive/
  README.txt          plain-English explanation of the folder
  index.html          browse everything in a web browser (works offline)
  index.csv           all photographs as a spreadsheet
  photos/
    YYYY-MM-DD/
      YYYY-MM-DD--<author>--<HHMM>--<id>.jpg
  book/
    book.csv           The Book's page list
  data/
    photos.csv
    members.csv
    book_entries.csv
    dates.csv
    date_turns.csv
  private/             only with --include-vault (see below)
```

**Filenames carry the meaning.** The date, who posted it, their local time,
and a short id are all in the filename. If every index file is lost, the folder
still says what happened, when, and who.

## How to run

From `apps/web/`:

```sh
npm run export                      # write to ./eva-and-adam-archive/
npm run export -- ./my-backup       # write to ./my-backup/
npm run export -- --verify          # export + verify checksums (recommended)
```

Or directly, from anywhere with the env vars set:

```sh
NODE_PATH=/path/to/apps/web/node_modules \
  node --experimental-strip-types tools/export/index.ts --verify
```

### Environment variables

The tool accepts the app's `.env.local` names first, so **a working
`apps/web/.env.local` is sufficient — no extra setup needed.**

| Preferred name (app's `.env.local`) | Fallback (standalone / CI) | What it is |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_KEY` | Service role key |

If both a preferred name and its fallback are set, the preferred name wins.
If neither is set, the tool exits immediately with a clear error.

To run with the app's env file already in your shell:

```sh
# source .env.local first, then run from apps/web/
cd apps/web
set -a && source .env.local && set +a
npm run export -- --verify
```

### Optional: `--verify`

Re-reads every written file and compares its SHA-256 against the value stored
in `photos.checksum_sha256`. Exits 1 if any file is missing or has the wrong
checksum. An export without `--verify` is a belief; an export with it is a
backup.

### Optional: `--include-vault`

Exports vault items to a `private/` folder inside the archive. Requires
`VAULT_PASSPHRASE` to be set — not to decrypt anything, but as an explicit
acknowledgement that you are exporting sensitive content.

Vault items have no original files; only the 1600px display variant exists
(migration 04 explains why at length). They are labelled `display` in the
vault index.

Without `--include-vault` (the default), vault bytes are never read or written.

## Resumable

Re-running skips files already present with a matching checksum. A dropped
connection does not mean starting over.

## Dependencies

Node.js built-ins and `@supabase/supabase-js`, already installed in
`apps/web/`. No new packages.

Runs under `node --experimental-strip-types` (Node.js 22.6+) or `tsx`.
Does not require a Next.js build or the app to be running.

## Tests

```sh
cd apps/web && npm run test:tools
```

Tests cover: filename composition, CSV escaping (comma, quote, and newline
in captions), the no-network assertion on `index.html`, and the checksum
verifier. All tests run against fixtures — no live database needed.

## Architecture note

`tools/export/read.ts` imports `@supabase/supabase-js` directly, bypassing
`apps/web/lib/data/*`. This is a deliberate break of ARCH §6.3 — see that
file's header for the reason. `apps/web/lib/schema.ts` (relation names and
storage path constants) is imported, as it has no runtime dependencies.
