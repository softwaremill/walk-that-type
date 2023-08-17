import { describe, test, expect } from "vitest";
import { evalT } from "./eval-type";
import { Environment, createEnvironment } from "../environment";
import { T, deepEquals } from "../type-node";

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

  test("union type", () => {
    const env1 = createEnvironment(`
    type Boxed<T> = [T];
    type MagicNumber<T> = 42;
    `).unwrap();
    // eval each member of the union
    expect(
      evalT(
        env1,
        T.union([T.numberLit(1), T.typeReference("Boxed", [T.numberLit(2)])])
      ).unwrap().type
    ).equalsTypeNode(T.union([T.numberLit(1), T.tuple([T.numberLit(2)])]));

    // simplify the union if possible
    expect(
      evalT(
        EMPTY_ENV,
        T.union([T.numberLit(1), T.numberLit(1), T.numberLit(2)])
      ).unwrap().type,
      "reduced duplicated elements"
    ).equalsTypeNode(T.union([T.numberLit(1), T.numberLit(2)]));

    expect(
      evalT(EMPTY_ENV, T.union([T.numberLit(42)])).unwrap().type,
      "single element union is evaluated to that element"
    ).equalsTypeNode(T.numberLit(42));

    expect(
      evalT(
        env1,
        T.union([
          T.numberLit(42),
          T.typeReference("MagicNumber", [T.numberLit(2)]),
        ])
      ).unwrap().type,
      "first evaluates all the members, then simplifies the union"
    ).equalsTypeNode(T.numberLit(42));

    expect(
      evalT(EMPTY_ENV, T.union([T.numberLit(42), T.unknown()])).unwrap().type,
      "anything, but any, with unknown is unknown"
    ).equalsTypeNode(T.unknown());

    expect(
      evalT(EMPTY_ENV, T.union([T.numberLit(42), T.never()])).unwrap().type,
      "never gets filtered out from union"
    ).equalsTypeNode(T.numberLit(42));

    expect(
      evalT(
        EMPTY_ENV,
        T.union([T.numberLit(42), T.unknown(), T.any()])
      ).unwrap().type,
      "any poisons the union"
    ).equalsTypeNode(T.any());

    expect(
      evalT(
        EMPTY_ENV,
        T.union([T.booleanLit(true), T.booleanLit(false), T.numberLit(42)])
      ).unwrap().type,
      "true | false simplifies to boolean"
    ).equalsTypeNode(T.union([T.numberLit(42), T.boolean()]));
  });
});
