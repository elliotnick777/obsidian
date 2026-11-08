# OBSIDIAN

**PROJECT NABONIDUS — Advanced Data Transformation Workstation**

A browser-local, desktop-first workstation for composing data transformations. React 19, strict TypeScript, Vite, Tailwind CSS 4, Lucide, Vitest, Web Crypto. No backend, analytics, external runtime requests, or processing APIs.

## Run locally

Use Node.js 22+ and npm:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Clipboard and Web Crypto require a secure context: localhost or HTTPS. All dependencies are bundled; no CDN fonts, scripts, or API keys are needed.

```sh
npm run typecheck
npm test
npm run build
```

Serve `dist/` with any static HTTP server or static host. Do not open `index.html` using `file://`; the application uses ES modules and web workers.

## Using the workstation

1. Type text, paste from the clipboard, or import/drop a local file in Input.
2. Select Text (UTF-8), Hex, or Base64 as the input representation. Binary files automatically use Hex to preserve their bytes.
3. Search the operation catalog and click an operation to append it to the recipe. Star frequently used operations.
4. Configure parameters inside each recipe block. Drag the grip to reorder, or use the accessible up/down buttons. Toggle power to bypass a step; use X to remove it.
5. Auto-run processes changes after 350 ms. Disable it to run manually with **Run recipe**.
6. Inspect the result as Text, Hex, or Base64. Copy it or download the displayed representation as TXT.
7. Save named recipes in the Recipes library. Import/export versioned JSON recipes from the workspace toolbar. History contains recent manually run or saved recipe configurations.

The initial sample demonstrates URL Decode → Base64 Decode → JSON Beautify. Other starter recipes demonstrate hashing and line cleanup. Loading a saved recipe preserves current input. Loading a sample replaces input with its demonstration data.

### Shortcuts

| Action            | Windows / Linux | macOS       |
| ----------------- | --------------- | ----------- |
| Execute recipe    | Ctrl+Enter      | Cmd+Enter   |
| Search operations | Ctrl+K          | Cmd+K       |
| Save recipe       | Ctrl+Shift+S    | Cmd+Shift+S |

## All 48 operations

| Category                 | Operations                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Encoding / Decoding (10) | Base64 Encode, Base64 Decode, Base32 Encode, Base32 Decode, URL Encode, URL Decode, Hex Encode, Hex Decode, HTML Entity Encode, HTML Entity Decode |
| Hashing (6)              | MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA-3-256                                                                                                   |
| Text (12)                | Reverse Text, Uppercase, Lowercase, Title Case, ROT13, ROT47, Regex Replace, Regex Match, Remove Whitespace, Trim Lines, Sort Lines, Unique Lines  |
| Binary / Hex / ASCII (8) | Text to Binary, Binary to Text, ASCII to Hex, Hex to ASCII, Hex to Decimal, Decimal to Hex, Binary to Hex, Hex to Binary                           |
| Data / Web (7)           | JSON Beautify, JSON Minify, JSON to CSV, CSV to JSON, JWT Decoder, HTML Tag Stripper, URL Parser                                                   |
| Security / Utilities (5) | XOR, Timestamp to Date, Date to Timestamp, UUID Generator, Random String Generator                                                                 |

## Behavior and limits

- The pipeline passes **Uint8Array bytes** between operations. Text operations strictly validate UTF-8. Hashes and XOR accept arbitrary bytes. Text output is a readable view; use Hex or Base64 for lossless binary display.
- Base64 and RFC 4648 Base32 decoders require correct standard padding and validate trailing bits. Whitespace is accepted; Base32 is case-insensitive. JWT uses base64url decoding internally.
- ASCII operations accept only bytes 0–127. Text-to-binary encodes UTF-8; binary conversions require complete 8-bit bytes. Numeric hex/decimal conversions use BigInt.
- URL encoding operates on components, not complete URLs. URL parsing requires an absolute URL. Repeated query parameters are preserved.
- JSON-to-CSV requires an array of flat objects, combines columns across rows, and uses RFC 4180 quoting. CSV-to-JSON treats cells as strings, requires unique headers, rejects inconsistent column counts, and parses quoted multiline fields. Inspect untrusted CSV before opening it in spreadsheet software; formula cells are preserved.
- Regex operations use JavaScript regular expressions, support flags/capture replacement, and return full matches. Match results are separated by newlines. Reverse Text reverses Unicode code points; Title Case uses Unicode word segmentation.
- Timestamp units are selectable. Date-to-Timestamp accepts `YYYY-MM-DD` (UTC) or ISO 8601 with an explicit timezone. Output dates are UTC.
- UUID and random-string generators **replace input**. UUID v4 uses `crypto.randomUUID()`. Strings use `crypto.getRandomValues()` with rejection sampling to avoid modulo bias.
- MD5 and SHA-1 are marked as obsolete for security-sensitive work. JWT decoding **never verifies signatures**.
- Limit: 8 MB input or intermediate output, 100 steps, 1 MB recipe JSON. Each execution has a 10-second worker timeout; long regexes cannot freeze the editor. Generation caps: 1,000 UUIDs or 100,000 characters.
- Format detection is heuristic and clearly marks ambiguous Hex/Base64 detections as “Possible”. It never silently changes input representation.

## Privacy and persistence

Input, output, imported file bytes, and intermediate data remain in memory and are not persisted or uploaded. Reloading clears input. On a first visit only, a non-sensitive demonstration input is loaded.

Local storage retains current/saved recipes, recipe configuration history (up to 20), favorites, and theme. **Recipe parameters are configuration and are stored, including a configured XOR key or regex replacement. Do not put secrets in recipe parameters if you do not want them retained.** Exported recipes contain parameters. Saved recipes are limited to 50 and can be deleted in the library. Clear Workspace resets input and current recipe; it preserves the library. Browser site-data controls can remove all persisted preferences.

Production uses bundled assets and no network-based transformations. Initial page/assets are downloaded from the host. Once loaded, processing requires no network. This is a local-first MVP; it does not install a service worker for offline page reloads.

## Architecture

```text
src/
  components/       Catalog, recipe editor, input/output editors, dialogs
  core/
    types.ts        Operation, parameter, recipe and result contracts
    bytes.ts        UTF-8 / binary conversions and format heuristics
    registry.ts     Central operation registry and parameter defaults
    pipeline.ts     Sequential byte pipeline and resource limits
    recipes.ts      Recipe schema validation and serialization
    worker.ts       Isolated execution entry point
  operations/       Encoding, hashing, text, binary, data, utilities
  hooks/            Worker lifecycle, debounce, local preferences
  tests/            Known vectors, invalid inputs, edge cases, pipeline tests
```

To add an operation, implement an `Operation` in its category module, register it through `core/registry.ts`, and add known-output/validation tests. The catalog, recipe controls, and import validator use the central definition automatically.

Web Crypto provides SHA-1/2 and secure randomness. `@noble/hashes` supplies MD5 and SHA-3-256, which Web Crypto does not expose. `papaparse` handles CSV and `he` handles HTML entities. No `eval()` or unsafe HTML rendering is used.

## Verification

Automated tests cover every operation with known vectors or output invariants; malformed inputs; arbitrary-byte round trips; Unicode; large integers; dates; regex parameters; secure generators; sequential pipelines; disabled steps; resource limits; and recipe import/export. Run `npm test` for current results. Browser QA covers the real worker, chained transformations, recipe editing, saving, local history, themes, and error recovery.
