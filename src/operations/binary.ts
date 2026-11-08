import { hex, unhex, utf8, text } from "../core/bytes";
import { op, textOp } from "./helpers";
const C = "Binary / Hex / ASCII";
function parseBinary(s: string): Uint8Array {
  const c = s.replace(/\s/g, "");
  if (!/^(?:[01]{8})*$/.test(c))
    throw new Error("Expected groups of eight binary digits.");
  return Uint8Array.from(c.match(/.{8}/g) ?? [], (x) => parseInt(x, 2));
}
function ascii(b: Uint8Array): void {
  if (b.some((x) => x > 127))
    throw new Error(
      "ASCII requires bytes in the range 0–127. Use Hex Encode/Decode for UTF-8 or arbitrary bytes.",
    );
}
export const binary = [
  op(
    "text-binary",
    "Text to Binary",
    C,
    "Encode UTF-8 text as space-separated 8-bit bytes.",
    (b) => utf8(Array.from(b, (x) => x.toString(2).padStart(8, "0")).join(" ")),
  ),
  op(
    "binary-text",
    "Binary to Text",
    C,
    "Decode groups of eight binary digits to UTF-8 text.",
    (b) => {
      const out = parseBinary(text(b));
      text(out);
      return out;
    },
  ),
  op(
    "ascii-hex",
    "ASCII to Hex",
    C,
    "Encode 7-bit ASCII bytes as hexadecimal.",
    (b) => {
      ascii(b);
      return utf8(hex(b));
    },
  ),
  op(
    "hex-ascii",
    "Hex to ASCII",
    C,
    "Decode hexadecimal pairs into 7-bit ASCII.",
    (b) => {
      const out = unhex(text(b));
      ascii(out);
      return out;
    },
  ),
  textOp(
    "hex-decimal",
    "Hex to Decimal",
    C,
    "Convert an arbitrary-length unsigned hexadecimal integer.",
    (s) => {
      const c = s.trim().replace(/^0x/i, "");
      if (!/^[0-9a-f]+$/i.test(c))
        throw new Error("Expected an unsigned hexadecimal integer.");
      return BigInt("0x" + c).toString(10);
    },
  ),
  textOp(
    "decimal-hex",
    "Decimal to Hex",
    C,
    "Convert an arbitrary-length unsigned decimal integer.",
    (s) => {
      if (!/^\d+$/.test(s.trim()))
        throw new Error("Expected an unsigned decimal integer.");
      return BigInt(s.trim()).toString(16);
    },
  ),
  op(
    "binary-hex",
    "Binary to Hex",
    C,
    "Convert whole binary bytes to hexadecimal.",
    (b) => utf8(hex(parseBinary(text(b)))),
  ),
  op(
    "hex-binary",
    "Hex to Binary",
    C,
    "Convert hexadecimal pairs to space-separated binary bytes.",
    (b) =>
      utf8(
        Array.from(unhex(text(b)), (x) => x.toString(2).padStart(8, "0")).join(
          " ",
        ),
      ),
  ),
];
