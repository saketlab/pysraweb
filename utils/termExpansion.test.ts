import { describe, expect, it } from "vitest";
import {
  EXPANSION_PARAM,
  expansionDisabled,
  readExpansionPreference,
  writeExpansionPreference,
} from "./termExpansion";

describe("expansionDisabled", () => {
  it("is off only for the explicit expand=0", () => {
    expect(expansionDisabled(new URLSearchParams("expand=0"))).toBe(true);
    expect(expansionDisabled(new URLSearchParams("q=liver"))).toBe(false);
    // Anything else means on — a stray value must not silently disable
    // expansion for a shared link.
    expect(expansionDisabled(new URLSearchParams("expand=1"))).toBe(false);
    expect(expansionDisabled(new URLSearchParams("expand=false"))).toBe(false);
  });

  it("names the param the search URL carries", () => {
    expect(EXPANSION_PARAM).toBe("expand");
  });
});

describe("expansion preference", () => {
  it("defaults to on with no storage (SSR) and round-trips with it", () => {
    expect(readExpansionPreference()).toBe(true);

    const store = new Map<string, string>();
    const g = globalThis as { window?: unknown };
    g.window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    };
    try {
      expect(readExpansionPreference()).toBe(true);
      writeExpansionPreference(false);
      expect(readExpansionPreference()).toBe(false);
      writeExpansionPreference(true);
      expect(readExpansionPreference()).toBe(true);
    } finally {
      delete g.window;
    }
  });
});
