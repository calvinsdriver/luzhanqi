import { describe, expect, it } from "vitest";
import { resolveCombat } from "../combat";

describe("resolveCombat", () => {
  it("attacker wins with higher rank", () => {
    expect(resolveCombat("GENERAL", "CAPTAIN")).toEqual({
      outcome: "attacker_wins",
      attackerSurvives: true,
      defenderSurvives: false,
    });
  });

  it("defender wins with higher rank", () => {
    expect(resolveCombat("CAPTAIN", "GENERAL")).toEqual({
      outcome: "defender_wins",
      attackerSurvives: false,
      defenderSurvives: true,
    });
  });

  it("equal ranks mutually destroy", () => {
    expect(resolveCombat("CAPTAIN", "CAPTAIN")).toEqual({
      outcome: "mutual_destruction",
      attackerSurvives: false,
      defenderSurvives: false,
    });
  });

  it("capturing the Flag wins the game outright, regardless of rank", () => {
    expect(resolveCombat("ENGINEER", "FLAG")).toEqual({
      outcome: "flag_captured",
      attackerSurvives: true,
      defenderSurvives: false,
    });
  });

  it("a Bomb mutually destroys any attacker, even the Field Marshal", () => {
    expect(resolveCombat("FIELD_MARSHAL", "BOMB")).toEqual({
      outcome: "mutual_destruction",
      attackerSurvives: false,
      defenderSurvives: false,
    });
  });

  it("a Bomb attacking anything mutually destroys, even a Landmine", () => {
    expect(resolveCombat("BOMB", "LANDMINE")).toEqual({
      outcome: "mutual_destruction",
      attackerSurvives: false,
      defenderSurvives: false,
    });
  });

  it("two Bombs mutually destroy each other", () => {
    expect(resolveCombat("BOMB", "BOMB")).toEqual({
      outcome: "mutual_destruction",
      attackerSurvives: false,
      defenderSurvives: false,
    });
  });

  it("a non-Engineer attacking a Landmine dies, and the mine survives", () => {
    expect(resolveCombat("FIELD_MARSHAL", "LANDMINE")).toEqual({
      outcome: "defender_wins",
      attackerSurvives: false,
      defenderSurvives: true,
    });
  });

  it("an Engineer safely defuses a Landmine", () => {
    expect(resolveCombat("ENGINEER", "LANDMINE")).toEqual({
      outcome: "attacker_wins",
      attackerSurvives: true,
      defenderSurvives: false,
    });
  });
});
