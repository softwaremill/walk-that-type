import { describe, test, expect } from "vitest";
import { evalT } from "./eval-type";
import { Environment, createEnvironment } from "./environment";
import { T } from "./type-node";
import { deepEquals } from "./extends-type";

export const EMPTY_ENV: Environment = {};

describe("eval", () => {
  test("Literal types", () => {
    expect(evalT(EMPTY_ENV, T.booleanLit(true)).unwrap().type.text()).toBe(
      "true"
    );

    expect(evalT(EMPTY_ENV, T.numberLit(42)).unwrap().type.text()).toBe("42");

    expect(evalT(EMPTY_ENV, T.stringLit("hello")).unwrap().type.text()).toBe(
      `"hello"`
    );
  });

  test("typeReference", () => {
    const env1 = createEnvironment(
      `type X = 42;
       type Y = "hello";
       type Z<Y> = [Y, Y];`
    ).unwrap();

    expect(
      evalT(env1, T.typeReference("Z", [T.stringLit("yo")]))
        .unwrap()
        .type.text()
    ).toBe('["yo", "yo"]');

    expect(
      evalT(env1, T.typeReference("Z", [T.typeReference("X", [])]))
        .unwrap()
        .type.text()
    ).toBe("[42, 42]");
  });

  test("tuple", () => {
    expect(
      deepEquals(evalT(EMPTY_ENV, T.tuple([])).unwrap().type, T.tuple([]))
    ).toBe(true);
  });
});
