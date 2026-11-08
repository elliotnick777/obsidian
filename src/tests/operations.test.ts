import { describe, expect, it } from "vitest";
import { operations, registry, defaults, createStep } from "../core/registry";
import {
  text,
  utf8,
  hex,
  unhex,
  unbase64,
  parseInput,
  detectFormat,
} from "../core/bytes";
import { executePipeline, MAX_BYTES } from "../core/pipeline";
import { exportRecipe, importRecipe } from "../core/recipes";
import type { Params } from "../core/types";
async function run(id: string, s: string, p: Params = {}): Promise<string> {
  const o = registry.get(id)!;
  return text(await o.run(utf8(s), { ...defaults(o), ...p }));
}
const vectors: [string, string, string, Params?][] = [
  ["base64-encode", "Hello World", "SGVsbG8gV29ybGQ="],
  ["base64-decode", "SGVsbG8gV29ybGQ=", "Hello World"],
  ["base32-encode", "foobar", "MZXW6YTBOI======"],
  ["base32-decode", "MZXW6YTBOI======", "foobar"],
  ["url-encode", "hello + /世界", "hello%20%2B%20%2F%E4%B8%96%E7%95%8C"],
  ["url-decode", "hello%20%2B", "hello +"],
  ["hex-encode", "Hi", "4869"],
  ["hex-decode", "48 69", "Hi"],
  ["html-encode", "<b>&", "&lt;b&gt;&amp;"],
  ["html-decode", "&lt;b&gt;&#x1F600;", "<b>😀"],
  ["md5", "abc", "900150983cd24fb0d6963f7d28e17f72"],
  ["sha-1", "abc", "a9993e364706816aba3e25717850c26c9cd0d89d"],
  [
    "sha-256",
    "abc",
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  ],
  [
    "sha-384",
    "abc",
    "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
  ],
  [
    "sha-512",
    "abc",
    "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
  ],
  [
    "sha3-256",
    "abc",
    "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532",
  ],
  ["reverse", "A😀B", "B😀A"],
  ["uppercase", "aBc", "ABC"],
  ["lowercase", "aBc", "abc"],
  ["titlecase", "hello WORLD", "Hello World"],
  ["rot13", "Hello!", "Uryyb!"],
  ["rot47", "Hello!", "w6==@P"],
  [
    "regex-replace",
    "abc 123",
    "abc #",
    { pattern: "\\d+", flags: "g", replacement: "#" },
  ],
  ["regex-match", "a12 b34", "12\n34", { pattern: "\\d+", flags: "g" }],
  ["remove-whitespace", " a\n b\t", "ab"],
  ["trim-lines", " a \n b ", "a\nb"],
  ["sort-lines", "z\na\nb", "a\nb\nz"],
  ["unique-lines", "a\nb\na", "a\nb"],
  ["text-binary", "AB", "01000001 01000010"],
  ["binary-text", "01000001 01000010", "AB"],
  ["ascii-hex", "Hi", "4869"],
  ["hex-ascii", "4869", "Hi"],
  ["hex-decimal", "ffffffffffffffff", "18446744073709551615"],
  ["decimal-hex", "18446744073709551615", "ffffffffffffffff"],
  ["binary-hex", "01000001", "41"],
  ["hex-binary", "41", "01000001"],
  ["json-beautify", '{"a":1}', '{\n  "a": 1\n}'],
  ["json-minify", '{ "a": 1 }', '{"a":1}'],
  ["json-csv", '[{"a":"a,b","b":1}]', 'a,b\n"a,b",1'],
  ["csv-json", 'a,b\n"a,b",1', '[\n  {\n    "a": "a,b",\n    "b": "1"\n  }\n]'],
  [
    "strip-html",
    '<b title=">">Hello</b> &amp; <script>alert(1)</script>',
    "Hello & ",
  ],
  ["timestamp-date", "0", "1970-01-01T00:00:00.000Z"],
  ["date-timestamp", "1970-01-01T00:00:00Z", "0"],
];
describe("operation registry", () => {
  it("has exactly 48 unique real operations", () => {
    expect(operations).toHaveLength(48);
    expect(registry.size).toBe(48);
    for (const o of operations) {
      expect(o.description).toBeTruthy();
      expect(o.run).toBeTypeOf("function");
    }
  });
});
describe("known operation vectors", () => {
  it.each(vectors)(
    "%s transforms known input",
    async (id, input, expected, p) => {
      expect(await run(id, input, p)).toBe(expected);
    },
  );
  it("decodes JWT without claiming verification", async () => {
    const out = JSON.parse(
      await run("jwt-decode", "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjMifQ."),
    );
    expect(out.header.alg).toBe("none");
    expect(out.payload.sub).toBe("123");
    expect(out.signatureVerified).toBe(false);
  });
  it("parses URLs and preserves repeated parameters", async () => {
    const out = JSON.parse(
      await run("url-parser", "https://example.com:8443/a?q=1&q=2#x"),
    );
    expect(out.hostname).toBe("example.com");
    expect(out.query).toHaveLength(2);
    expect(out.port).toBe("8443");
  });
  it("XORs exact bytes reversibly", async () => {
    const o = registry.get("xor")!;
    const p = { key: "ff", keyFormat: "Hex" };
    const a = unhex("00ff41");
    const b = await o.run(a, p);
    expect(hex(b)).toBe("ff00be");
    expect(await o.run(b, p)).toEqual(a);
  });
  it("generates valid unique UUID v4 values", async () => {
    const lines = (await run("uuid", "", { count: 10 })).split("\n");
    expect(new Set(lines).size).toBe(10);
    for (const s of lines)
      expect(s).toMatch(
        /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/,
      );
  });
  it("generates exact secure random string length in custom alphabet", async () => {
    const s = await run("random-string", "", {
      length: 1024,
      alphabet: "AB😀",
    });
    expect(Array.from(s)).toHaveLength(1024);
    expect(Array.from(s).every((c) => "AB😀".includes(c))).toBe(true);
  });
});
describe("validation and edge cases", () => {
  const bad: [string, string, Params?][] = [
    ["base64-decode", "abc"],
    ["base64-decode", "AB=="],
    ["base32-decode", "MY====="],
    ["base32-decode", "MZ======"],
    ["hex-decode", "abc"],
    ["url-decode", "%GG"],
    ["binary-text", "0101"],
    ["binary-hex", "nope"],
    ["hex-binary", "z1"],
    ["hex-decimal", "0xz"],
    ["decimal-hex", "1.5"],
    ["ascii-hex", "😀"],
    ["hex-ascii", "ff"],
    ["json-minify", "{"],
    ["json-beautify", "no"],
    ["json-csv", "{}"],
    ["json-csv", '[{"a":{}}]'],
    ["csv-json", "a,b\n1"],
    ["csv-json", "a,a\n1,2"],
    ["jwt-decode", "a.b.c"],
    ["url-parser", "/relative"],
    ["timestamp-date", "abc"],
    ["date-timestamp", "2026-02-30"],
    ["date-timestamp", "yesterday"],
    ["xor", "x", { key: "" }],
    ["uuid", "", { count: 0 }],
    ["random-string", "", { alphabet: "aa" }],
    ["regex-replace", "x", { pattern: "[" }],
    ["regex-match", "x", { flags: "gg" }],
    ["sort-lines", "a\n2", { numeric: true }],
  ];
  it.each(bad)("%s rejects malformed input", async (id, s, p) => {
    await expect(run(id, s, p)).rejects.toThrow();
  });
  it("roundtrips all byte values without UTF-8 corruption", async () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    for (const [enc, dec] of [
      ["base64-encode", "base64-decode"],
      ["base32-encode", "base32-decode"],
      ["hex-encode", "hex-decode"],
    ]) {
      const encoded = await registry.get(enc)!.run(bytes, {});
      expect(await registry.get(dec)!.run(encoded, {})).toEqual(bytes);
    }
  });
  it("handles empty encodings and Unicode", async () => {
    for (const id of [
      "base64-encode",
      "base64-decode",
      "base32-encode",
      "base32-decode",
      "hex-encode",
      "hex-decode",
      "reverse",
      "unique-lines",
    ])
      expect(await run(id, "")).toBe("");
    expect(
      await run("base64-decode", await run("base64-encode", "世界😀")),
    ).toBe("世界😀");
  });
  it("sorts numbers descending", async () =>
    expect(
      await run("sort-lines", "2\n10\n1", { numeric: true, descending: true }),
    ).toBe("10\n2\n1"));
  it("supports millisecond timestamps", async () => {
    expect(await run("timestamp-date", "1000", { unit: "Milliseconds" })).toBe(
      "1970-01-01T00:00:01.000Z",
    );
    expect(
      await run("date-timestamp", "1970-01-01T00:00:01Z", {
        unit: "Milliseconds",
      }),
    ).toBe("1000");
  });
  it("supports regex captures and empty matches", async () => {
    expect(
      await run("regex-replace", "ab", { pattern: "(a)", replacement: "$1$1" }),
    ).toBe("aab");
    expect(await run("regex-match", "ab", { pattern: "z" })).toBe("");
  });
  it("validates byte parsers", () => {
    expect(() => unhex("x")).toThrow();
    expect(() => unbase64("!!!!")).toThrow();
    expect(parseInput("ff", "Hex")[0]).toBe(255);
    expect(detectFormat('{"a":1}')).toBe("JSON");
  });
});
describe("recipe pipeline and serialization", () => {
  it("executes sequentially and reports every stage", async () => {
    const steps = ["reverse", "base64-encode", "sha-256"].map(createStep);
    const r = await executePipeline(utf8("Hello World"), steps);
    expect(text(r.output)).toBe(
      await run("sha-256", await run("base64-encode", "dlroW olleH")),
    );
    expect(r.timings).toHaveLength(3);
  });
  it("skips disabled steps", async () => {
    const s = createStep("uppercase");
    s.enabled = false;
    expect(text((await executePipeline(utf8("abc"), [s])).output)).toBe("abc");
  });
  it("preserves bytes in an empty recipe", async () =>
    expect((await executePipeline(unhex("00ff"), [])).output).toEqual(
      unhex("00ff"),
    ));
  it("includes operation name in errors", async () => {
    await expect(
      executePipeline(utf8("!"), [createStep("base64-decode")]),
    ).rejects.toThrow("Base64 Decode");
  });
  it("rejects oversized input", async () => {
    await expect(
      executePipeline(new Uint8Array(MAX_BYTES + 1), []),
    ).rejects.toThrow("limit");
  });
  it("roundtrips recipes", () => {
    const r = {
      version: 1 as const,
      name: "My recipe",
      steps: [createStep("xor")],
    };
    expect(importRecipe(exportRecipe(r))).toEqual(r);
  });
  it.each(["null", "{}", "{", '{"version":2,"name":"bad","steps":[]}'])(
    "rejects malformed imported recipes",
    (s) => expect(() => importRecipe(s)).toThrow(),
  );
  it("rejects unknown operations, invalid params and duplicate ids", () => {
    const s = createStep("uuid");
    for (const steps of [
      [{ ...s, operationId: "eval" }],
      [{ ...s, params: { count: -1 } }],
      [s, s],
      [{ ...s, params: { count: "10" } }],
      [{ ...s, params: { evil: 1 } }],
    ])
      expect(() =>
        importRecipe(JSON.stringify({ version: 1, name: "x", steps })),
      ).toThrow();
  });
});
describe("regression cases", () => {
  it("title-cases Unicode words and apostrophes", async () =>
    expect(await run("titlecase", "élève CAN'T STOP")).toBe(
      "Élève Can't Stop",
    ));
  it("parses multiline CSV fields", async () =>
    expect(
      JSON.parse(
        await run("csv-json", 'a,b\n"line 1\nline 2","quote ""here"""'),
      ),
    ).toEqual([{ a: "line 1\nline 2", b: 'quote "here"' }]));
  it("does not execute or render imported HTML", async () =>
    expect(
      await run("strip-html", '<img src=x onerror="alert(1)"><b>safe</b>'),
    ).toBe("safe"));
  it("handles empty JSON arrays and CSV", async () => {
    expect(await run("json-csv", "[]")).toBe("");
    expect(await run("csv-json", "")).toBe("[]");
  });
  it("uses a shared column union for heterogeneous objects", async () =>
    expect(await run("json-csv", '[{"a":1},{"b":2}]')).toBe("a,b\n1,\n,2"));
  it("normalizes explicit date offsets to UTC", async () =>
    expect(await run("date-timestamp", "1970-01-01T01:00:00+01:00")).toBe("0"));
  it("rejects invalid select options on recipe import", () => {
    const s = createStep("xor");
    s.params.keyFormat = "unknown";
    expect(() =>
      importRecipe(JSON.stringify({ version: 1, name: "test", steps: [s] })),
    ).toThrow("Invalid option");
  });
});
