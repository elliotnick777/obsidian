export const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);
export const text = (b: Uint8Array): string => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(b);
  } catch {
    throw new Error(
      "Input is not valid UTF-8. Use a binary operation or choose a hex/base64 input format.",
    );
  }
};
export const hex = (b: Uint8Array): string =>
  Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
export function unhex(s: string): Uint8Array {
  const clean = s.replace(/\s/g, "");
  if (!/^(?:[0-9a-f]{2})*$/i.test(clean))
    throw new Error("Expected pairs of hexadecimal digits (00–ff).");
  return Uint8Array.from(clean.match(/../g) ?? [], (n) => parseInt(n, 16));
}
export function base64(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i += 8192)
    s += String.fromCharCode(...b.subarray(i, i + 8192));
  return btoa(s);
}
export function unbase64(s: string): Uint8Array {
  const c = s.replace(/\s/g, "");
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(c)
  )
    throw new Error(
      "Invalid Base64. Use the standard alphabet and correct padding.",
    );
  const bytes = Uint8Array.from(atob(c), (n) => n.charCodeAt(0));
  if (base64(bytes) !== c) throw new Error("Invalid Base64 padding bits.");
  return bytes;
}
export function parseInput(s: string, format: string): Uint8Array {
  if (format === "Hex") return unhex(s);
  if (format === "Base64") return unbase64(s);
  return utf8(s);
}
export function displayBytes(b: Uint8Array, format: string): string {
  if (format === "Hex")
    return (
      hex(b)
        .match(/.{1,2}/g)
        ?.join(" ") ?? ""
    );
  if (format === "Base64") return base64(b);
  return new TextDecoder().decode(b);
}
export function detectFormat(s: string): string {
  if (!s.trim()) return "Empty";
  try {
    JSON.parse(s);
    return "JSON";
  } catch {}
  if (/^https?:\/\/\S+$/.test(s)) return "URL";
  if (/^[\w-]+\.[\w-]+\.[\w-]*$/.test(s)) return "JWT-like";
  if (/^(?:[0-9a-f]{2}\s*){4,}$/i.test(s)) return "Possible hex";
  if (s.length >= 8 && s.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s))
    return "Possible Base64";
  return "UTF-8 text";
}
