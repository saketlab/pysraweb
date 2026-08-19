// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  findRanges,
  partitionWords,
  termForMatch,
  wordsPattern,
} from "./query-highlight";

const matches = (words: string[]) => {
  const pattern = wordsPattern(words);
  return pattern ? findRanges(pattern).map((r) => r.toString()) : [];
};

describe("wordsPattern", () => {
  it("is null when the server matched nothing", () => {
    expect(wordsPattern([])).toBeNull();
    expect(wordsPattern([" "])).toBeNull();
  });
});

describe("findRanges", () => {
  it("marks whole words only, not fragments inside other words", () => {
    document.body.innerHTML =
      "<p>An accurate separation of rat and rats from a rating.</p>";
    // Postgres reports both surface forms; 'accurate'/'rating' are not matches.
    expect(matches(["rat", "rats"])).toEqual(["rat", "rats"]);
  });

  it("matches case-insensitively and across hyphens", () => {
    document.body.innerHTML = "<p>Single-cell RNA-seq of SINGLE cells</p>";
    expect(matches(["single", "cell", "cells"])).toEqual([
      "Single",
      "cell",
      "SINGLE",
      "cells",
    ]);
  });

  it("skips chrome and empty nodes", () => {
    document.body.innerHTML =
      "<nav>cell</nav><script>cell</script><p>   </p><p>cell</p>";
    expect(matches(["cell"])).toEqual(["cell"]);
  });

  it("returns nothing when the page has not loaded its text yet", () => {
    document.body.innerHTML = "<p>   </p>";
    expect(matches(["cell"])).toEqual([]);
  });
});

describe("partitionWords", () => {
  const derived = { activates: "s methyltransferase activity" };

  it("splits the words expansion brought in from the ones typed", () => {
    expect(partitionWords(["spinal", "activates"], derived)).toEqual({
      own: ["spinal"],
      expanded: ["activates"],
    });
  });

  it("treats everything as typed when nothing was expanded", () => {
    expect(partitionWords(["spinal"], undefined)).toEqual({
      own: ["spinal"],
      expanded: [],
    });
  });
});

describe("termForMatch", () => {
  // Words are matched case-insensitively, so the page hands back whatever case
  // it uses while the server's keys are lowercase.
  it("looks up the source term case-insensitively", () => {
    const derived = { activates: "s methyltransferase activity" };
    expect(termForMatch("Activates", derived)).toBe(
      "s methyltransferase activity",
    );
    expect(termForMatch("spinal", derived)).toBeNull();
    expect(termForMatch("activates", undefined)).toBeNull();
  });
});
