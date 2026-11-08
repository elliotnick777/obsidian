import { md5 } from "@noble/hashes/legacy";
import { sha3_256 } from "@noble/hashes/sha3";
import { hex, utf8 } from "../core/bytes";
import { op } from "./helpers";
const C = "Hashing";
export const hashing = [
  op(
    "md5",
    "MD5",
    C,
    "Calculate the 128-bit MD5 digest.",
    (b) => utf8(hex(md5(b))),
    [],
    "Cryptographically outdated. Do not use for passwords, signatures, or security-sensitive integrity checks.",
  ),
  ...(["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const).map((name) =>
    op(
      name.toLowerCase(),
      name,
      C,
      `Calculate the ${name} digest using Web Crypto.`,
      async (b) =>
        utf8(
          hex(
            new Uint8Array(
              await crypto.subtle.digest(name, new Uint8Array(b).buffer),
            ),
          ),
        ),
      [],
      name === "SHA-1"
        ? "Cryptographically outdated. Do not use for security-sensitive applications."
        : undefined,
    ),
  ),
  op(
    "sha3-256",
    "SHA-3-256",
    C,
    "Calculate the NIST SHA-3 256-bit digest.",
    (b) => utf8(hex(sha3_256(b))),
  ),
];
