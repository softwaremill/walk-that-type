import { describe, expect, it } from "vitest";
import { createEnvironment } from ".";
import { extendsType } from "./extendsType";
import { T, TypeNode } from "./TypeNode";
import { EMPTY_ENV } from "./eval.test";

describe("extends", () => {
  it("should return true for T extends T", () => {
    const env1 = createEnvironment(
      `type X = 42;
       type Y = "hello";
       type Z<Y> = [Y, Y];`
    ).unwrap();

    expect(extendsType(env1, T.numberLit(42), T.numberLit(42)).extends).toBe(
      true
    );
    expect(
      extendsType(
        env1,
        T.typeReference("Z", [T.numberLit(11)]),
        T.typeReference("Z", [T.numberLit(11)])
      ).extends
    ).toBe(true);
    expect(
      extendsType(env1, T.typeReference("X", []), T.typeReference("Y", []))
        .extends
    ).toBe(false);
  });

  it("literals extends their sets", () => {
    expect(extendsType(EMPTY_ENV, T.numberLit(42), T.number).extends).toBe(
      true
    );

    expect(extendsType(EMPTY_ENV, T.booleanLit(true), T.boolean).extends).toBe(
      true
    );

    expect(extendsType(EMPTY_ENV, T.stringLit("yo"), T.string).extends).toBe(
      true
    );

    expect(extendsType(EMPTY_ENV, T.stringLit("yo"), T.number).extends).toBe(
      false
    );
  });

  it("extends work for any, never, unknown, etc.", () => {
    // based on: https://www.typescriptlang.org/docs/handbook/type-compatibility.html#any-unknown-object-void-undefined-null-and-never-assignability

    // ANY
    expect(extendsType(EMPTY_ENV, T.any, T.unknown).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.any, T.void).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.any, T.undefined).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.any, T.null).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.any, T.never).extends).toBe(false);

    // UNKNOWN
    expect(extendsType(EMPTY_ENV, T.unknown, T.any).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.unknown, T.void).extends).toBe(false);
    expect(extendsType(EMPTY_ENV, T.unknown, T.undefined).extends).toBe(false);
    expect(extendsType(EMPTY_ENV, T.unknown, T.null).extends).toBe(false);
    expect(extendsType(EMPTY_ENV, T.unknown, T.never).extends).toBe(false);

    // VOID
    expect(extendsType(EMPTY_ENV, T.void, T.any).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.void, T.unknown).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.void, T.undefined).extends).toBe(false);
    expect(extendsType(EMPTY_ENV, T.void, T.null).extends).toBe(false);
    expect(extendsType(EMPTY_ENV, T.void, T.never).extends).toBe(false);

    // UNDEFINED
    expect(extendsType(EMPTY_ENV, T.undefined, T.any).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.undefined, T.unknown).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.undefined, T.void).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.undefined, T.null).extends).toBe(false);
    expect(extendsType(EMPTY_ENV, T.undefined, T.never).extends).toBe(false);

    // NULL
    expect(extendsType(EMPTY_ENV, T.null, T.any).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.null, T.unknown).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.null, T.void).extends).toBe(false);
    expect(extendsType(EMPTY_ENV, T.null, T.undefined).extends).toBe(false);
    expect(extendsType(EMPTY_ENV, T.null, T.never).extends).toBe(false);

    // NEVER
    expect(extendsType(EMPTY_ENV, T.never, T.any).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.never, T.unknown).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.never, T.void).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.never, T.undefined).extends).toBe(true);
    expect(extendsType(EMPTY_ENV, T.never, T.null).extends).toBe(true);
  });

  it("should work with tuples", () => {
    expect(extendsType(EMPTY_ENV, T.tuple([]), T.tuple([])).extends).toBe(true);
    const exampleTuple = T.tuple([
      T.numberLit(1),
      T.numberLit(2),
      T.numberLit(3),
      T.stringLit("a"),
      T.stringLit("b"),
      T.stringLit("c"),
    ]) as Extract<TypeNode, { _type: "tuple" }>;

    expect(
      extendsType(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([T.number, T.number, T.number, T.string, T.string, T.string])
      ).extends
    ).toBe(true);

    expect(
      extendsType(EMPTY_ENV, exampleTuple, T.tuple([T.number, T.rest(T.any)]))
        .extends
    ).toBe(true);

    expect(
      extendsType(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([T.number, T.rest(T.array(T.any))])
      ).extends
    ).toBe(true);

    expect(
      extendsType(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([T.rest(T.array(T.any)), T.number])
      ).extends
    ).toBe(false);

    expect(
      extendsType(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([
          T.rest(T.array(T.any)),
          T.number,
          T.string,
          T.string,
          T.string,
        ])
      ).extends
    ).toBe(true);

    // test inferring

    expect(
      extendsType(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([T.infer("X"), T.rest(T.array(T.any))])
      ).inferredTypes.X
    ).toEqual(T.numberLit(1));

    expect(
      extendsType(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([T.rest(T.array(T.any)), T.infer("X")])
      ).inferredTypes.X
    ).toEqual(T.stringLit("c"));

    expect(
      extendsType(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([T.infer("X"), T.rest(T.array(T.any)), T.infer("Y")])
      ).inferredTypes
    ).toEqual({
      X: T.numberLit(1),
      Y: T.stringLit("c"),
    });

    expect(
      extendsType(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([T.infer("Head"), T.rest(T.infer("Rest"))])
      ).inferredTypes
    ).toEqual({
      Head: T.numberLit(1),
      Rest: T.tuple(exampleTuple.elements.slice(1)),
    });
  });
});
