import { describe, expect, it, test } from "vitest";
import { createEnvironment } from "../environment";
import { extendsT } from "./extendsT";
import { T, TypeNode, deepEquals } from "../type-node";
import { EMPTY_ENV } from "../evalT/eval-type.test";

describe("extends", () => {
  it("should return true for T extends T", () => {
    const env1 = createEnvironment(
      `type X = 42;
       type Y = "hello";
       type Z<Y> = [Y, Y];`
    ).unwrap();

    expect(extendsT(env1, T.numberLit(42), T.numberLit(42)).extends).toBe(true);
    expect(
      extendsT(
        env1,
        T.typeReference("Z", [T.numberLit(11)]),
        T.typeReference("Z", [T.numberLit(11)])
      ).extends
    ).toBe(true);
    expect(
      extendsT(env1, T.typeReference("X", []), T.typeReference("Y", [])).extends
    ).toBe(false);
  });

  it("literals extends their sets", () => {
    expect(extendsT(EMPTY_ENV, T.numberLit(42), T.number()).extends).toBe(true);

    expect(extendsT(EMPTY_ENV, T.booleanLit(true), T.boolean()).extends).toBe(
      true
    );

    expect(extendsT(EMPTY_ENV, T.stringLit("yo"), T.string()).extends).toBe(
      true
    );

    expect(extendsT(EMPTY_ENV, T.stringLit("yo"), T.number()).extends).toBe(
      false
    );
  });

  it("extends work for any, never, unknown, etc.", () => {
    // based on: https://www.typescriptlang.org/docs/handbook/type-compatibility.html#any-unknown-object-void-undefined-null-and-never-assignability

    // ANY
    expect(extendsT(EMPTY_ENV, T.any(), T.unknown()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.any(), T.void()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.any(), T.undefined()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.any(), T.null()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.any(), T.never()).extends).toBe(false);

    // UNKNOWN
    expect(extendsT(EMPTY_ENV, T.unknown(), T.any()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.unknown(), T.void()).extends).toBe(false);
    expect(extendsT(EMPTY_ENV, T.unknown(), T.undefined()).extends).toBe(false);
    expect(extendsT(EMPTY_ENV, T.unknown(), T.null()).extends).toBe(false);
    expect(extendsT(EMPTY_ENV, T.unknown(), T.never()).extends).toBe(false);

    // VOID
    expect(extendsT(EMPTY_ENV, T.void(), T.any()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.void(), T.unknown()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.void(), T.undefined()).extends).toBe(false);
    expect(extendsT(EMPTY_ENV, T.void(), T.null()).extends).toBe(false);
    expect(extendsT(EMPTY_ENV, T.void(), T.never()).extends).toBe(false);

    // UNDEFINED
    expect(extendsT(EMPTY_ENV, T.undefined(), T.any()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.undefined(), T.unknown()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.undefined(), T.void()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.undefined(), T.null()).extends).toBe(false);
    expect(extendsT(EMPTY_ENV, T.undefined(), T.never()).extends).toBe(false);

    // NULL
    expect(extendsT(EMPTY_ENV, T.null(), T.any()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.null(), T.unknown()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.null(), T.void()).extends).toBe(false);
    expect(extendsT(EMPTY_ENV, T.null(), T.undefined()).extends).toBe(false);
    expect(extendsT(EMPTY_ENV, T.null(), T.never()).extends).toBe(false);

    // NEVER
    expect(extendsT(EMPTY_ENV, T.never(), T.any()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.never(), T.unknown()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.never(), T.void()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.never(), T.undefined()).extends).toBe(true);
    expect(extendsT(EMPTY_ENV, T.never(), T.null()).extends).toBe(true);
  });

  it("should work with tuples", () => {
    expect(extendsT(EMPTY_ENV, T.tuple([]), T.tuple([])).extends).toBe(true);
    const exampleTuple = T.tuple([
      T.numberLit(1),
      T.numberLit(2),
      T.numberLit(3),
      T.stringLit("a"),
      T.stringLit("b"),
      T.stringLit("c"),
    ]) as Extract<TypeNode, { _type: "tuple" }>;

    expect(
      extendsT(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([
          T.number(),
          T.number(),
          T.number(),
          T.string(),
          T.string(),
          T.string(),
        ])
      ).extends
    ).toBe(true);

    expect(
      extendsT(EMPTY_ENV, exampleTuple, T.tuple([T.number(), T.rest(T.any())]))
        .extends
    ).toBe(true);

    expect(
      extendsT(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([T.number(), T.rest(T.array(T.any()))])
      ).extends
    ).toBe(true);

    expect(
      extendsT(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([T.rest(T.array(T.any())), T.number()])
      ).extends
    ).toBe(false);

    expect(
      extendsT(
        EMPTY_ENV,
        exampleTuple,
        T.tuple([
          T.rest(T.array(T.any())),
          T.number(),
          T.string(),
          T.string(),
          T.string(),
        ])
      ).extends
    ).toBe(true);

    // test inferring

    expect(
      deepEquals(
        extendsT(
          EMPTY_ENV,
          exampleTuple,
          T.tuple([T.infer("X"), T.rest(T.array(T.any()))])
        ).inferredTypes.X,
        T.typeDeclaration("X", [], T.numberLit(1))
      )
    ).toEqual(true);

    expect(
      deepEquals(
        extendsT(
          EMPTY_ENV,
          exampleTuple,
          T.tuple([T.rest(T.array(T.any())), T.infer("X")])
        ).inferredTypes.X,
        T.typeDeclaration("X", [], T.stringLit("c"))
      )
    ).toEqual(true);

    const result1 = extendsT(
      EMPTY_ENV,
      exampleTuple,
      T.tuple([T.infer("X"), T.rest(T.array(T.any())), T.infer("Y")])
    ).inferredTypes;

    expect(
      deepEquals(result1.X, T.typeDeclaration("X", [], T.numberLit(1)))
    ).toEqual(true);
    expect(
      deepEquals(result1.Y, T.typeDeclaration("Y", [], T.stringLit("c")))
    ).toEqual(true);

    const result2 = extendsT(
      EMPTY_ENV,
      exampleTuple,
      T.tuple([T.infer("Head"), T.rest(T.infer("Rest"))])
    ).inferredTypes;

    expect(
      deepEquals(result2.Head, T.typeDeclaration("Head", [], T.numberLit(1)))
    ).toEqual(true);

    expect(
      deepEquals(
        result2.Rest,
        T.typeDeclaration(
          "Rest",
          [],
          T.tuple([
            T.numberLit(2),
            T.numberLit(3),
            T.stringLit("a"),
            T.stringLit("b"),
            T.stringLit("c"),
          ])
        )
      )
    ).toEqual(true);
  });
});

describe("extends union", () => {
  test("For union to be assignable to a type, every element within the union must be assignable to that type", () => {
    expect(
      extendsT(
        EMPTY_ENV,
        T.union([T.stringLit("a"), T.stringLit("b")]),
        T.stringLit("a")
      ).extends
    ).toBe(false);

    expect(
      extendsT(
        EMPTY_ENV,
        T.union([T.stringLit("a"), T.stringLit("b")]),
        T.string()
      ).extends
    ).toBe(true);

    expect(
      extendsT(
        EMPTY_ENV,
        T.union([T.stringLit("a"), T.stringLit("b"), T.number()]),
        T.string()
      ).extends
    ).toBe(false);
  });

  test("For any type to be assignable to an union, it must be assignable to at least one union member", () => {
    expect(
      extendsT(
        EMPTY_ENV,
        T.stringLit("a"),
        T.union([T.stringLit("a"), T.stringLit("b")])
      ).extends
    ).toBe(true);

    expect(
      extendsT(
        EMPTY_ENV,
        T.string(),
        T.union([T.stringLit("a"), T.stringLit("b")])
      ).extends
    ).toBe(false);

    expect(
      extendsT(
        EMPTY_ENV,
        T.string(),
        T.union([T.stringLit("a"), T.stringLit("b"), T.number()])
      ).extends
    ).toBe(false);

    expect(
      extendsT(
        EMPTY_ENV,
        T.numberLit(42),
        T.union([T.stringLit("a"), T.stringLit("b"), T.number()])
      ).extends
    ).toBe(true);
  });
});

describe("extends object", () => {
  test("2 objects with the same keys", () => {
    expect(
      extendsT(
        EMPTY_ENV,
        T.object([
          [T.stringLit("a"), T.numberLit(1)],
          [T.stringLit("b"), T.stringLit("yo")],
        ]),
        T.object([
          [T.stringLit("a"), T.numberLit(1)],
          [T.stringLit("b"), T.stringLit("yo")],
        ])
      ).extends
    ).toBe(true);

    expect(
      extendsT(
        EMPTY_ENV,
        T.object([
          [T.stringLit("a"), T.numberLit(1)],
          [T.stringLit("b"), T.stringLit("yo")],
        ]),
        T.object([
          [T.stringLit("a"), T.number()],
          [T.stringLit("b"), T.string()],
        ])
      ).extends
    ).toBe(true);
  });

  test("object A can be assigned to object B if it has at least all properties of B", () => {
    expect(
      extendsT(
        EMPTY_ENV,
        T.object([
          [T.stringLit("a"), T.numberLit(1)],
          [T.stringLit("b"), T.stringLit("yo")],
        ]),
        T.object([[T.stringLit("a"), T.number()]])
      ).extends
    ).toBe(true);

    expect(
      extendsT(
        EMPTY_ENV,
        T.object([[T.stringLit("a"), T.number()]]),
        T.object([
          [T.stringLit("a"), T.numberLit(1)],
          [T.stringLit("b"), T.stringLit("yo")],
        ])
      ).extends
    ).toBe(false);
  });

  test("nested object test", () => {
    expect(
      extendsT(
        EMPTY_ENV,
        T.object([
          [T.stringLit("a"), T.numberLit(1)],
          [
            T.stringLit("b"),
            T.object([
              [
                T.stringLit("c"),
                T.union([T.booleanLit(true), T.booleanLit(false)]),
              ],
              [T.stringLit("d"), T.stringLit("yo")],
            ]),
          ],
        ]),
        T.object([
          [T.stringLit("a"), T.number()],
          [
            T.stringLit("b"),
            T.object([
              [
                T.stringLit("c"),
                T.union([T.booleanLit(true), T.booleanLit(false)]),
              ],
              [T.stringLit("d"), T.string()],
            ]),
          ],
        ])
      ).extends
    ).toBe(true);

    expect(
      extendsT(
        EMPTY_ENV,
        T.object([
          [T.stringLit("a"), T.numberLit(1)],
          [
            T.stringLit("b"),
            T.object([
              [
                T.stringLit("c"),
                T.union([T.booleanLit(true), T.booleanLit(false)]),
              ],
            ]),
          ],
        ]),
        T.object([
          [T.stringLit("a"), T.number()],
          [
            T.stringLit("b"),
            T.object([
              [
                T.stringLit("c"),
                T.union([T.booleanLit(true), T.booleanLit(false)]),
              ],
              [T.stringLit("d"), T.string()],
            ]),
          ],
        ])
      ).extends
    ).toBe(false);
  });

  test("inferring in objects", () => {
    const result = extendsT(
      EMPTY_ENV,
      T.object([
        [T.stringLit("a"), T.numberLit(1)],
        [T.stringLit("b"), T.stringLit("yo")],
      ]),
      T.object([
        [T.stringLit("a"), T.infer("X")],
        [T.stringLit("b"), T.infer("Y")],
      ])
    ).inferredTypes;

    expect(result.X).equalsTypeNode(T.typeDeclaration("X", [], T.numberLit(1)));
    expect(result.Y).equalsTypeNode(
      T.typeDeclaration("Y", [], T.stringLit("yo"))
    );
  });
});
