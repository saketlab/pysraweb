import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// source-level: the popup only mounts inside an opened MapContainer marker
const SOURCE = readFileSync(
  join(__dirname, "submitting-org-map.tsx"),
  "utf8",
);

describe("submitting org map popup", () => {
  it("never renders marker fields as raw HTML", () => {
    expect(SOURCE).not.toContain("dangerouslySetInnerHTML");
  });

  it("does not build popup markup by string concatenation", () => {
    expect(SOURCE).not.toContain("<strong>${");
    expect(SOURCE).not.toContain('join("<br/>")');
  });
});
