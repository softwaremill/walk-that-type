import { describe, test, expect } from "vitest";
import { evalType } from "./eval";
import { Environment, createEnvironment } from "./environment";

export const EMPTY_ENV: Environment = {};

describe("eval", () => {
  test("Literal types", () => {
    expect(
      evalType(EMPTY_ENV, {
        _type: "booleanLiteral",
        value: true,
        text: "true",
      }).unwrap().text
    ).toBe("true");

    expect(
      evalType(EMPTY_ENV, {
        _type: "numberLiteral",
        value: 42,
        text: "42",
      }).unwrap().text
    ).toBe("42");

    expect(
      evalType(EMPTY_ENV, {
        _type: "stringLiteral",
        value: "hello",
        text: "hello",
      }).unwrap().text
    ).toBe("hello");
  });

  test("typeReference", () => {
    const env1 = createEnvironment(
      `type X = 42;
       type Y = "hello";
       type Z<Y> = [Y, Y];`
    ).unwrap();

    expect(
      evalType(env1, {
        _type: "typeReference",
        name: "Z",
        typeArguments: [
          {
            _type: "stringLiteral",
            value: "yo",
            text: `"yo"`,
          },
        ],
        text: "Z<'yo'>",
      }).unwrap().text
    ).toBe('["yo", "yo"]');

    expect(
      evalType(env1, {
        _type: "typeReference",
        name: "Z",
        typeArguments: [
          {
            _type: "typeReference",
            name: "X",
            typeArguments: [],
            text: "X",
          },
        ],
        text: "Z<X>",
      }).unwrap().text
    ).toBe("[42, 42]");
  });
});
