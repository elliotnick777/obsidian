import { check, field, str, textOp } from "./helpers";
const C = "Text";
const regexParams = [
  field("pattern", "Pattern", "\\w+"),
  field("flags", "Flags", "g"),
];
function regex(p: Record<string, string | boolean | number>): RegExp {
  const pattern = str(p, "pattern");
  if (pattern.length > 4096)
    throw new Error("Regex pattern exceeds 4,096 characters.");
  try {
    return new RegExp(pattern, str(p, "flags"));
  } catch (e) {
    throw new Error(`Invalid regular expression: ${(e as Error).message}`);
  }
}
export const textOperations = [
  textOp(
    "reverse",
    "Reverse Text",
    C,
    "Reverse Unicode code points, preserving multibyte characters.",
    (s) => Array.from(s).reverse().join(""),
  ),
  textOp("uppercase", "Uppercase", C, "Convert text to uppercase.", (s) =>
    s.toUpperCase(),
  ),
  textOp("lowercase", "Lowercase", C, "Convert text to lowercase.", (s) =>
    s.toLowerCase(),
  ),
  textOp(
    "titlecase",
    "Title Case",
    C,
    "Capitalize the first letter of each word.",
    (s) =>
      Array.from(
        new Intl.Segmenter("en", { granularity: "word" }).segment(
          s.toLowerCase(),
        ),
        (part) =>
          part.isWordLike
            ? part.segment.charAt(0).toUpperCase() + part.segment.slice(1)
            : part.segment,
      ).join(""),
  ),
  textOp("rot13", "ROT13", C, "Rotate Latin letters by 13 places.", (s) =>
    s.replace(/[a-z]/gi, (c) =>
      String.fromCharCode(
        c.charCodeAt(0) + (c.toLowerCase() <= "m" ? 13 : -13),
      ),
    ),
  ),
  textOp(
    "rot47",
    "ROT47",
    C,
    "Rotate printable ASCII characters by 47 places.",
    (s) =>
      s.replace(/[!-~]/g, (c) =>
        String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94)),
      ),
  ),
  textOp(
    "regex-replace",
    "Regex Replace",
    C,
    "Replace regular expression matches. Supports $1 capture groups.",
    (s, p) => s.replace(regex(p), str(p, "replacement")),
    [...regexParams, field("replacement", "Replacement", "")],
  ),
  textOp(
    "regex-match",
    "Regex Match",
    C,
    "Extract full regex matches, one per line.",
    (s, p) => {
      const r = regex(p);
      return r.global
        ? Array.from(s.matchAll(r), (m) => m[0]).join("\n")
        : (s.match(r)?.[0] ?? "");
    },
    regexParams,
  ),
  textOp(
    "remove-whitespace",
    "Remove Whitespace",
    C,
    "Remove spaces, tabs, newlines, and Unicode whitespace.",
    (s) => s.replace(/\s/gu, ""),
  ),
  textOp(
    "trim-lines",
    "Trim Lines",
    C,
    "Trim leading and trailing whitespace from each line.",
    (s) =>
      s
        .split(/\r?\n/)
        .map((x) => x.trim())
        .join("\n"),
  ),
  textOp(
    "sort-lines",
    "Sort Lines",
    C,
    "Sort lines lexically or numerically.",
    (s, p) => {
      const a = s.split(/\r?\n/);
      if (p.numeric && a.some((x) => !x.trim() || !Number.isFinite(Number(x))))
        throw new Error("Numeric sorting requires one finite number per line.");
      a.sort(
        p.numeric
          ? (a, b) => Number(a) - Number(b)
          : (a, b) => (a < b ? -1 : a > b ? 1 : 0),
      );
      return (p.descending ? a.reverse() : a).join("\n");
    },
    [check("descending", "Descending order"), check("numeric", "Numeric sort")],
  ),
  textOp(
    "unique-lines",
    "Unique Lines",
    C,
    "Remove duplicate lines, preserving their original order.",
    (s) => Array.from(new Set(s.split(/\r?\n/))).join("\n"),
  ),
];
