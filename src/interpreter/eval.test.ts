import { describe, test, expect } from "vitest";
import { evalType } from "./eval";
import { Environment, createEnvironment } from "./environment";
import { T } from "./TypeNode";

export const EMPTY_ENV: Environment = {};

describe("eval", () => {
  test("Literal types", () => {
    expect(evalType(EMPTY_ENV, T.booleanLit(true)).unwrap().text).toBe("true");

    expect(evalType(EMPTY_ENV, T.numberLit(42)).unwrap().text).toBe("42");

    expect(evalType(EMPTY_ENV, T.stringLit("hello")).unwrap().text).toBe(
      "hello"
    );
  });

  test("typeReference", () => {
    const env1 = createEnvironment(
      `type X = 42;
       type Y = "hello";
       type Z<Y> = [Y, Y];`
    ).unwrap();

    expect(
      evalType(env1, T.typeReference("Z", [T.stringLit("yo")])).unwrap().text
    ).toBe('["yo", "yo"]');

    expect(
      evalType(env1, T.typeReference("Z", [T.typeReference("X", [])])).unwrap()
        .text
    ).toBe("[42, 42]");
  });

  test("tuple", () => {
    expect(evalType(EMPTY_ENV, T.tuple([])).unwrap()).toEqual(T.tuple([]));
  });
});
