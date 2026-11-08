import { utf8, unhex, unbase64 } from "../core/bytes";
import { field, integer, number, op, str, textOp } from "./helpers";
const C = "Security / Utilities";
export const utilities = [
  op(
    "xor",
    "XOR",
    C,
    "XOR each byte with a repeating key. Apply twice to recover the input.",
    (b, p) => {
      const raw = str(p, "key");
      const key =
        p.keyFormat === "Hex"
          ? unhex(raw)
          : p.keyFormat === "Base64"
            ? unbase64(raw)
            : utf8(raw);
      if (!key.length) throw new Error("XOR key must not be empty.");
      return b.map((n, i) => n ^ key[i % key.length]);
    },
    [
      field("key", "Key", "secret"),
      field("keyFormat", "Key format", "Text", "select", [
        "Text",
        "Hex",
        "Base64",
      ]),
    ],
  ),
  textOp(
    "timestamp-date",
    "Timestamp to Date",
    C,
    "Convert a Unix timestamp to an ISO 8601 UTC date.",
    (s, p) => {
      if (!/^-?\d+(?:\.\d+)?$/.test(s.trim()))
        throw new Error("Expected a numeric Unix timestamp.");
      const ms = Number(s) * (p.unit === "Milliseconds" ? 1 : 1000);
      const d = new Date(ms);
      if (!Number.isFinite(ms) || Number.isNaN(d.getTime()))
        throw new Error("Timestamp is outside the supported date range.");
      return d.toISOString();
    },
    [
      field("unit", "Timestamp unit", "Seconds", "select", [
        "Seconds",
        "Milliseconds",
      ]),
    ],
  ),
  textOp(
    "date-timestamp",
    "Date to Timestamp",
    C,
    "Convert an explicit ISO 8601 date to a Unix timestamp.",
    (s, p) => {
      const value = s.trim();
      if (
        !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(
          value,
        )
      )
        throw new Error(
          "Use YYYY-MM-DD or ISO 8601 with an explicit timezone.",
        );
      const [year, month, day] = value.slice(0, 10).split("-").map(Number);
      if (
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > new Date(Date.UTC(year, month, 0)).getUTCDate()
      )
        throw new Error("Invalid calendar date.");
      const ms = Date.parse(value);
      if (Number.isNaN(ms)) throw new Error("Invalid ISO 8601 date.");
      return String(p.unit === "Milliseconds" ? ms : Math.floor(ms / 1000));
    },
    [
      field("unit", "Timestamp unit", "Seconds", "select", [
        "Seconds",
        "Milliseconds",
      ]),
    ],
  ),
  op(
    "uuid",
    "UUID Generator",
    C,
    "Generate cryptographically random version 4 UUIDs. Replaces the input.",
    (_b, p) =>
      utf8(
        Array.from({ length: integer(p, "count", 1, 1000) }, () =>
          crypto.randomUUID(),
        ).join("\n"),
      ),
    [number("count", "Number of UUIDs", 1, 1, 1000)],
  ),
  op(
    "random-string",
    "Random String Generator",
    C,
    "Generate an unbiased string using secure browser randomness. Replaces input.",
    (_b, p) => {
      const length = integer(p, "length", 1, 100000);
      const chars = Array.from(str(p, "alphabet"));
      if (
        !chars.length ||
        chars.length > 256 ||
        new Set(chars).size !== chars.length
      )
        throw new Error(
          "Alphabet must contain 1–256 unique Unicode characters.",
        );
      const out: string[] = [];
      const limit = 256 - (256 % chars.length);
      while (out.length < length) {
        const bytes = crypto.getRandomValues(
          new Uint8Array(Math.min(65536, length * 2)),
        );
        for (const b of bytes) {
          if (b < limit) {
            out.push(chars[b % chars.length]);
            if (out.length === length) break;
          }
        }
      }
      return utf8(out.join(""));
    },
    [
      number("length", "Length", 32, 1, 100000),
      field(
        "alphabet",
        "Alphabet",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      ),
    ],
  ),
];
