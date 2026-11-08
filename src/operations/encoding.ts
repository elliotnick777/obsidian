import he from "he";
import { base64, unbase64, hex, unhex, utf8, text } from "../core/bytes";
import { op, textOp } from "./helpers";
const C = "Encoding / Decoding";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Encode(b: Uint8Array): string {
  let bits = 0,
    value = 0,
    out = "";
  for (const byte of b) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits) out += alphabet[(value << (5 - bits)) & 31];
  return out.padEnd(Math.ceil(out.length / 8) * 8, "=");
}
export function base32Decode(s: string): Uint8Array {
  const clean = s.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z2-7]*={0,6}$/.test(clean) || clean.length % 8 !== 0)
    throw new Error("Invalid RFC 4648 Base32 alphabet or padding.");
  let bits = 0,
    value = 0;
  const result: number[] = [];
  for (const c of clean.replace(/=+$/, "")) {
    value = (value << 5) | alphabet.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const b = Uint8Array.from(result);
  if (base32Encode(b) !== clean)
    throw new Error("Invalid Base32 padding or trailing bits.");
  return b;
}
export const encoding = [
  op(
    "base64-encode",
    "Base64 Encode",
    C,
    "Encode bytes using the standard Base64 alphabet.",
    (b) => utf8(base64(b)),
  ),
  op(
    "base64-decode",
    "Base64 Decode",
    C,
    "Decode a padded Base64 string to its original bytes.",
    (b) => unbase64(text(b)),
  ),
  op(
    "base32-encode",
    "Base32 Encode",
    C,
    "Encode bytes as RFC 4648 Base32.",
    (b) => utf8(base32Encode(b)),
  ),
  op(
    "base32-decode",
    "Base32 Decode",
    C,
    "Decode RFC 4648 Base32 into bytes.",
    (b) => base32Decode(text(b)),
  ),
  textOp(
    "url-encode",
    "URL Encode",
    C,
    "Percent-encode a UTF-8 URL component.",
    (s) => encodeURIComponent(s),
  ),
  textOp(
    "url-decode",
    "URL Decode",
    C,
    "Decode percent escapes in a URL component.",
    (s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        throw new Error("Malformed URL escape or invalid UTF-8 sequence.");
      }
    },
  ),
  op(
    "hex-encode",
    "Hex Encode",
    C,
    "Represent every byte as two hexadecimal digits.",
    (b) => utf8(hex(b)),
  ),
  op(
    "hex-decode",
    "Hex Decode",
    C,
    "Decode hexadecimal byte pairs; whitespace is allowed.",
    (b) => unhex(text(b)),
  ),
  textOp(
    "html-encode",
    "HTML Entity Encode",
    C,
    "Escape text as safe HTML entities.",
    (s) => he.encode(s, { useNamedReferences: true }),
  ),
  textOp(
    "html-decode",
    "HTML Entity Decode",
    C,
    "Decode named and numeric HTML entities as plain text.",
    (s) => he.decode(s),
  ),
];
