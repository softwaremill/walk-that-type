import { describe, test, expect } from "vitest";
import { evalT } from "./eval-type";
import { Environment, createEnvironment } from "../environment";
import { T, deepEquals } from "../type-node";
import { globalTypes } from "../global-types";

export const EMPTY_ENV: Environment = globalTypes;

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

  test("object type", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.object([
          [T.stringLit("a"), T.numberLit(1)],
          [
            T.stringLit("b"),
            T.union([T.booleanLit(true), T.booleanLit(false)]),
          ],
        ])
      ).unwrap().type
    ).equalsTypeNode(
      T.object([
        [T.stringLit("a"), T.numberLit(1)],
        [T.stringLit("b"), T.boolean()],
      ])
    );

    expect(
      evalT(
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
        ])
      ).unwrap().type
    ).equalsTypeNode(
      T.object([
        [T.stringLit("a"), T.numberLit(1)],
        [T.stringLit("b"), T.object([[T.stringLit("c"), T.boolean()]])],
      ])
    );
  });

  test("Uppercase", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Uppercase", [T.stringLit("hello")])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit("HELLO"));

    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Uppercase", [T.stringLit("HELLO")])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit("HELLO"));

    expect(
      evalT(EMPTY_ENV, T.typeReference("Uppercase", [T.stringLit("")])).unwrap()
        .type
    ).equalsTypeNode(T.stringLit(""));
  });

  test("Lowercase", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Lowercase", [T.stringLit("HELLO")])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit("hello"));
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Lowercase", [T.stringLit("hello")])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit("hello"));
    expect(
      evalT(EMPTY_ENV, T.typeReference("Lowercase", [T.stringLit("")])).unwrap()
        .type
    ).equalsTypeNode(T.stringLit(""));
  });

  test("Capitalize", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Capitalize", [T.stringLit("hello")])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit("Hello"));
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Capitalize", [T.stringLit("heLLO")])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit("HeLLO"));
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Capitalize", [T.stringLit("")])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit(""));
  });

  test("Uncapitalize", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Uncapitalize", [T.stringLit("HEllo")])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit("hEllo"));
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Uncapitalize", [T.stringLit("")])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit(""));
  });
});

describe("distributive union", () => {
  test("ToArray<T> with naked type", () => {
    expect(
      evalT(
        createEnvironment(
          `type ToArray<Type> = Type extends any ? Type[] : never;`
        ).unwrap(),
        T.typeReference("ToArray", [T.union([T.string(), T.number()])])
      ).unwrap().type
    ).equalsTypeNode(T.union([T.array(T.string()), T.array(T.number())]));
  });

  test("ToArrayNonDist<T> with non-naked type", () => {
    expect(
      evalT(
        createEnvironment(
          `type ToArrayNonDist<Type> = [Type] extends [any] ? Type[] : never;`
        ).unwrap(),
        T.typeReference("ToArrayNonDist", [T.union([T.string(), T.number()])])
      ).unwrap().type
    ).equalsTypeNode(T.array(T.union([T.string(), T.number()])));
  });

  test("multiple union arguments, but only one distributive union", () => {
    expect(
      evalT(
        createEnvironment(
          `type ToArray<T1, T2> = T1 extends any ? 
          [T1, T2]
          : never;`
        ).unwrap(),
        T.typeReference("ToArray", [
          T.union([T.string(), T.number()]),
          T.union([T.numberLit(1), T.numberLit(2)]),
        ])
      ).unwrap().type
    ).equalsTypeNode(
      T.union([
        T.tuple([T.string(), T.union([T.numberLit(1), T.numberLit(2)])]),
        T.tuple([T.number(), T.union([T.numberLit(1), T.numberLit(2)])]),
      ])
    );
  });

  test("double distributive union", () => {
    expect(
      evalT(
        createEnvironment(
          `type ToArray<T1, T2> = T1 extends any ? 
          T2 extends any 
              ? [T1, T2]
              : never
          : never;`
        ).unwrap(),
        T.typeReference("ToArray", [
          T.union([T.string(), T.number()]),
          T.union([T.numberLit(1), T.numberLit(2)]),
        ])
      ).unwrap().type
    ).equalsTypeNode(
      T.union([
        T.tuple([T.string(), T.numberLit(1)]),
        T.tuple([T.string(), T.numberLit(2)]),
        T.tuple([T.number(), T.numberLit(1)]),
        T.tuple([T.number(), T.numberLit(2)]),
      ])
    );
  });
});

describe("global types", () => {
  test("Exclude", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Exclude", [
          T.union([T.stringLit("a"), T.stringLit("b"), T.stringLit("c")]),
          T.stringLit("a"),
        ])
      ).unwrap().type
    ).equalsTypeNode(T.union([T.stringLit("b"), T.stringLit("c")]));
  });

  test("Extract", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.typeReference("Extract", [
          T.union([T.stringLit("a"), T.stringLit("b"), T.stringLit("c")]),
          T.union([T.stringLit("a"), T.stringLit("f")]),
        ])
      ).unwrap().type
    ).equalsTypeNode(T.stringLit("a"));
  });

  test("Pick", () => {
    expect(
      evalT(
        createEnvironment(`
        type Todo = {
          title: string;
          description: string;
          completed: boolean;
        } 
        `).unwrap(),
        T.typeReference("Pick", [
          T.typeReference("Todo", []),
          T.union([T.stringLit("title"), T.stringLit("completed")]),
        ])
      ).unwrap().type
    ).equalsTypeNode(
      T.object([
        [T.stringLit("title"), T.string()],
        [T.stringLit("completed"), T.boolean()],
      ])
    );
  });

  // TODO: uncomment when done
  // test("Omit", () => {
  //   expect(
  //     evalT(
  //       createEnvironment(`
  //       type Todo = {
  //         title: string;
  //         description: string;
  //         completed: boolean;
  //       }
  //       `).unwrap(),
  //       T.typeReference("Omit", [
  //         T.typeReference("Todo", []),
  //         T.union([T.stringLit("title"), T.stringLit("completed")]),
  //       ])
  //     ).unwrap().type
  //   ).equalsTypeNode(T.object([[T.stringLit("description"), T.string()]]));
  // });
});

describe("mapped types", () => {
  test("basic mapped type", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.mappedType(
          "k",
          T.union([T.stringLit("a"), T.stringLit("b"), T.stringLit("c")]),
          undefined,
          T.typeReference("k", [])
        )
      ).unwrap().type
    ).equalsTypeNode(
      T.object([
        [T.stringLit("a"), T.stringLit("a")],
        [T.stringLit("b"), T.stringLit("b")],
        [T.stringLit("c"), T.stringLit("c")],
      ])
    );
  });

  test("mapped type with remapping", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.mappedType(
          "k",
          T.union([T.stringLit("a"), T.stringLit("b"), T.stringLit("c")]),
          T.typeReference("Uppercase", [T.typeReference("k", [])]),
          T.string()
        )
      ).unwrap().type
    ).equalsTypeNode(
      T.object([
        [T.stringLit("A"), T.string()],
        [T.stringLit("B"), T.string()],
        [T.stringLit("C"), T.string()],
      ])
    );
  });

  test("mapped type: filtering with remapping", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.mappedType(
          "k",
          T.union([T.stringLit("a"), T.stringLit("b"), T.stringLit("c")]),
          T.typeReference("Exclude", [
            T.typeReference("k", []),
            T.union([T.stringLit("a"), T.stringLit("b")]),
          ]),
          T.typeReference("k", [])
        )
      ).unwrap().type
    ).equalsTypeNode(T.object([[T.stringLit("c"), T.stringLit("c")]]));

    expect(
      evalT(
        EMPTY_ENV,
        T.mappedType(
          "Property",
          T.union([T.stringLit("kind"), T.stringLit("radius")]),
          T.typeReference("Exclude", [
            T.typeReference("Property", []),
            T.stringLit("kind"),
          ]),
          T.typeReference("Property", [])
        )
      ).unwrap().type
    ).equalsTypeNode(
      T.object([[T.stringLit("radius"), T.stringLit("radius")]])
    );
  });
});

describe("indexed access type", () => {
  test("object single property", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.indexedAccessType(
          T.object([
            [T.stringLit("a"), T.string()],
            [T.stringLit("b"), T.number()],
          ]),
          T.stringLit("a")
        )
      ).unwrap().type
    ).equalsTypeNode(T.string());

    expect(
      evalT(
        EMPTY_ENV,
        T.indexedAccessType(
          T.object([
            [T.stringLit("a"), T.string()],
            [T.stringLit("b"), T.number()],
          ]),
          T.stringLit("b")
        )
      ).unwrap().type
    ).equalsTypeNode(T.number());
  });

  test("object multiple properties", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.indexedAccessType(
          T.object([
            [T.stringLit("a"), T.string()],
            [T.stringLit("b"), T.number()],
          ]),
          T.union([T.stringLit("a"), T.stringLit("b")])
        )
      ).unwrap().type
    ).equalsTypeNode(T.union([T.string(), T.number()]));
  });

  test("array single prop", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.indexedAccessType(T.tuple([T.string(), T.number()]), T.numberLit(0))
      ).unwrap().type
    ).equalsTypeNode(T.string());

    expect(
      evalT(
        EMPTY_ENV,
        T.indexedAccessType(T.tuple([T.string(), T.number()]), T.numberLit(1))
      ).unwrap().type
    ).equalsTypeNode(T.number());
  });

  test("array multiple properties", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.indexedAccessType(
          T.tuple([T.string(), T.number()]),
          T.union([T.numberLit(0), T.numberLit(1)])
        )
      ).unwrap().type
    ).equalsTypeNode(T.union([T.string(), T.number()]));
  });

  test("array length prop", () => {
    expect(
      evalT(
        EMPTY_ENV,
        T.indexedAccessType(
          T.tuple([T.string(), T.number()]),
          T.stringLit("length")
        )
      ).unwrap().type
    ).equalsTypeNode(T.numberLit(2));

    expect(
      evalT(
        EMPTY_ENV,
        T.indexedAccessType(T.tuple([]), T.stringLit("length"))
      ).unwrap().type
    ).equalsTypeNode(T.numberLit(0));
  });
});
