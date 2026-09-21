import { describe, expect, it } from "vitest";
import { translateServerError } from "../translateServerError";
import { TRANSLATIONS, type TranslationKey } from "../translations";

const tEn = (key: TranslationKey) => TRANSLATIONS.en[key];
const tZh = (key: TranslationKey) => TRANSLATIONS.zh[key];

describe("translateServerError", () => {
  it("translates a known server message", () => {
    expect(translateServerError("This game is already full", tEn)).toBe("This game is already full");
    expect(translateServerError("This game is already full", tZh)).toBe("该游戏已满");
  });

  it("passes through an unrecognized message unchanged", () => {
    expect(translateServerError("some future message not in the map", tZh)).toBe(
      "some future message not in the map",
    );
  });
});
