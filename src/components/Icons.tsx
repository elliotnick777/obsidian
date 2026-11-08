import {
  Binary,
  Braces,
  Fingerprint,
  KeyRound,
  LetterText,
  ScanLine,
} from "lucide-react";
import type { Category } from "../core/types";
export const categoryIcons = {
  "Encoding / Decoding": ScanLine,
  Hashing: Fingerprint,
  Text: LetterText,
  "Binary / Hex / ASCII": Binary,
  "Data / Web": Braces,
  "Security / Utilities": KeyRound,
} satisfies Record<Category, typeof Binary>;
export function ObsidianMark() {
  return (
    <svg
      width="29"
      height="33"
      viewBox="0 0 40 44"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 2 36 13 30 40H10L4 13Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m20 2-8 26 18 12M4 13l26 27M12 28l24-15M20 2l10 38"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}
