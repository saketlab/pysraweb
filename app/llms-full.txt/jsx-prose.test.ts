import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractHowSearchWorks } from "./jsx-prose";

const guide = extractHowSearchWorks(
  readFileSync("app/howsearchworks/page.tsx", "utf8"),
);

describe("extractHowSearchWorks", () => {
  it("extracts every section of the live page", () => {
    for (const heading of [
      "### Write plain keywords",
      "### Structured search",
      "### How results are ranked",
      "### Where the synonyms come from",
      "### How synonym expansion is bounded",
    ]) {
      expect(guide).toContain(heading);
    }
  });

  it("keeps operators, examples and formulae", () => {
    expect(guide).toContain("`liver NOT tumor`");
    expect(guide).toContain("Good: `crispr screen liver`");
    expect(guide).toContain("N_{\\max} = 200");
  });

  it("leaves no JSX behind", () => {
    expect(guide).not.toMatch(/<\/?[A-Za-z]/);
    expect(guide).not.toContain('{" "}');
    expect(guide).not.toContain("%%TIPS%%");
    expect(guide).not.toContain("export default");
  });

  it("puts each list item on one line", () => {
    expect(guide).not.toMatch(/^-\s*$/m);
  });

  it("returns null rather than mangled text for an unrelated page", () => {
    expect(extractHowSearchWorks("export default function X() {\n return (<p>hi</p>);\n}")).toBeNull();
  });
});
