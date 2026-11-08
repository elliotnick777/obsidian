import Papa from "papaparse";
import he from "he";
import { text, unbase64 } from "../core/bytes";
import { field, textOp } from "./helpers";
const C = "Data / Web";
function json(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }
}
function jwtPart(s: string): unknown {
  if (!/^[\w-]+$/.test(s)) throw new Error("Invalid JWT base64url segment.");
  const standard = s.replace(/-/g, "+").replace(/_/g, "/");
  return json(
    text(unbase64(standard.padEnd(Math.ceil(standard.length / 4) * 4, "="))),
  );
}
export const data = [
  textOp(
    "json-beautify",
    "JSON Beautify",
    C,
    "Validate and format JSON with indentation.",
    (s, p) => JSON.stringify(json(s), null, Number(p.indent)),
    [field("indent", "Indentation", "2", "select", ["2", "4"])],
  ),
  textOp(
    "json-minify",
    "JSON Minify",
    C,
    "Validate JSON and remove insignificant whitespace.",
    (s) => JSON.stringify(json(s)),
  ),
  textOp(
    "json-csv",
    "JSON to CSV",
    C,
    "Convert an array of flat objects to RFC 4180 CSV.",
    (s) => {
      const a = json(s);
      if (
        !Array.isArray(a) ||
        a.some((x) => x === null || typeof x !== "object" || Array.isArray(x))
      )
        throw new Error("Expected a JSON array of flat objects.");
      const columns = Array.from(new Set(a.flatMap((x) => Object.keys(x))));
      for (const row of a)
        if (Object.values(row).some((x) => x !== null && typeof x === "object"))
          throw new Error(
            "Nested objects and arrays are not supported in CSV.",
          );
      return Papa.unparse(
        {
          fields: columns,
          data: a.map((row) => columns.map((k) => row[k] ?? "")),
        },
        { newline: "\n" },
      );
    },
  ),
  textOp(
    "csv-json",
    "CSV to JSON",
    C,
    "Parse CSV headers and quoted fields into JSON objects.",
    (s) => {
      if (!s.trim()) return "[]";
      const r = Papa.parse<Record<string, string>>(s, {
        header: true,
        skipEmptyLines: true,
        delimiter: ",",
        transformHeader: (h) => h,
      });
      if (r.errors.length)
        throw new Error(`Invalid CSV: ${r.errors[0].message}`);
      if (
        new Set(r.meta.fields).size !== r.meta.fields?.length ||
        r.meta.renamedHeaders
      )
        throw new Error("CSV headers must be unique.");
      if (
        r.meta.fields?.some(
          (k) => !k || ["__proto__", "constructor", "prototype"].includes(k),
        )
      )
        throw new Error("CSV contains an empty or reserved header.");
      return JSON.stringify(r.data, null, 2);
    },
  ),
  textOp(
    "jwt-decode",
    "JWT Decoder",
    C,
    "Inspect a JWT header and payload. No signature verification.",
    (s) => {
      const parts = s.trim().split(".");
      if (
        parts.length !== 3 ||
        !parts[0] ||
        !parts[1] ||
        !/^[-\w]*$/.test(parts[2])
      )
        throw new Error(
          "Expected a compact JWT with three base64url segments.",
        );
      const header = jwtPart(parts[0]),
        payload = jwtPart(parts[1]);
      if (
        !header ||
        typeof header !== "object" ||
        Array.isArray(header) ||
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
      )
        throw new Error("JWT header and payload must be JSON objects.");
      return JSON.stringify(
        { header, payload, signature: parts[2], signatureVerified: false },
        null,
        2,
      );
    },
    [],
    "Inspection only. Decoding does not verify the signature or establish that this token is trustworthy.",
  ),
  textOp(
    "strip-html",
    "HTML Tag Stripper",
    C,
    "Remove HTML markup and decode entities into plain text.",
    (s) =>
      he.decode(
        s
          .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
          .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
          .replace(/<\/?[a-z!][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/gi, ""),
      ),
  ),
  textOp(
    "url-parser",
    "URL Parser",
    C,
    "Inspect an absolute URL and its query parameters.",
    (s) => {
      let u: URL;
      try {
        u = new URL(s.trim());
      } catch {
        throw new Error("Expected a valid absolute URL, including its scheme.");
      }
      return JSON.stringify(
        {
          scheme: u.protocol.slice(0, -1),
          origin: u.origin,
          username: u.username,
          password: u.password,
          hostname: u.hostname,
          port: u.port,
          pathname: u.pathname,
          query: Array.from(u.searchParams, ([key, value]) => ({ key, value })),
          fragment: u.hash.slice(1),
        },
        null,
        2,
      );
    },
  ),
];
