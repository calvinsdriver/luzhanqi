import { describe, expect, it } from "vitest";
import { translatePlacementError, translatePlacementErrors } from "../translatePlacementErrors";
import { TRANSLATIONS, type Language, type TranslationKey } from "../translations";

function makeT(lang: Language) {
  return (key: TranslationKey, params?: Record<string, string | number>) => {
    const template = TRANSLATIONS[lang][key] ?? key;
    if (!params) return template;
    return Object.entries(params).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), template);
  };
}

const tEn = makeT("en");
const tZh = makeT("zh");

describe("translatePlacementError", () => {
  it("translates the roster-count mismatch shape, including the piece name", () => {
    expect(translatePlacementError("Expected 3 CAPTAIN, got 4", tEn)).toBe("Expected 3 Captain, got 4");
    expect(translatePlacementError("Expected 3 CAPTAIN, got 4", tZh)).toBe("应有 3 个连长，当前 4 个");
  });

  it("translates the duplicate-node shape", () => {
    expect(translatePlacementError("Node P0-3-2 is used more than once", tZh)).toBe("该格子被重复使用");
  });

  it("translates the wrong-territory shape", () => {
    expect(translatePlacementError("Node P0-3-2 is not in seat 0's territory", tZh)).toBe(
      "该格子不在你的领地内",
    );
  });

  it("translates the Flag/Landmine/Bomb placement shapes", () => {
    expect(translatePlacementError("Flag must be placed on a headquarters node, not P0-3-2", tZh)).toBe(
      "军旗必须放置在大本营格子上",
    );
    expect(translatePlacementError("Landmine at P0-3-2 must be in the rear two rows", tZh)).toBe(
      "地雷必须放置在最后两排",
    );
    expect(translatePlacementError("Bomb at P0-0-2 cannot be placed on the front row", tZh)).toBe(
      "炸弹不能放置在第一排",
    );
  });

  it("passes through an unrecognized shape unchanged", () => {
    expect(translatePlacementError("some future message shape", tZh)).toBe("some future message shape");
  });
});

describe("translatePlacementErrors", () => {
  it("maps over the whole list", () => {
    expect(
      translatePlacementErrors(["Expected 1 FLAG, got 0", "Unknown node: X"], tEn),
    ).toEqual(["Expected 1 Flag, got 0", "Unknown square"]);
  });
});
