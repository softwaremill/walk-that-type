import { expect, test } from "vitest";
import { createEnvironment } from "../environment";
import { createTypeToEval } from "..";
import { evalType } from "../eval-type";
import { T } from "../type-node";
import { deepEquals } from "../extends-type";

test("First", () => {
  const env = createEnvironment(
    `type First<T extends any[]> = T extends [infer Head, ...any] ? Head : never;`
  ).unwrap();

  expect(
    deepEquals(
      evalType(env, createTypeToEval(`First<[1, 2, 3]>`).unwrap()).unwrap(),
      T.numberLit(1)
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalType(env, createTypeToEval(`First<[42]>`).unwrap()).unwrap(),
      T.numberLit(42)
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalType(env, createTypeToEval(`First<[]>`).unwrap()).unwrap(),
      T.never()
    )
  ).toBe(true);
});

test("Last", () => {
  const env = createEnvironment(
    `type Last<T extends any[]> = T extends [...any, infer L] ? L : never;`
  ).unwrap();

  expect(
    deepEquals(
      evalType(env, createTypeToEval(`Last<[1, 2, 3]>`).unwrap()).unwrap(),
      T.numberLit(3)
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalType(env, createTypeToEval(`Last<[42]>`).unwrap()).unwrap(),
      T.numberLit(42)
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalType(env, createTypeToEval(`Last<[]>`).unwrap()).unwrap(),
      T.never()
    )
  ).toBe(true);
});

test("Concat", () => {
  const env = createEnvironment(
    `type Concat<T extends any[], U extends any[]> = [...T, ...U];`
  ).unwrap();

  expect(
    deepEquals(
      evalType(env, createTypeToEval(`Concat<[], []>`).unwrap()).unwrap(),
      T.tuple([])
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalType(env, createTypeToEval(`Concat<[], [1]>`).unwrap()).unwrap(),
      T.tuple([T.numberLit(1)])
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalType(
        env,
        createTypeToEval(`Concat<[1, 2], [3, 4]>`).unwrap()
      ).unwrap(),
      T.tuple([T.numberLit(1), T.numberLit(2), T.numberLit(3), T.numberLit(4)])
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalType(
        env,
        createTypeToEval(
          `Concat<["1", 2, "3"], [false, boolean, "4"]>`
        ).unwrap()
      ).unwrap(),
      T.tuple([
        T.stringLit("1"),
        T.numberLit(2),
        T.stringLit("3"),
        T.booleanLit(false),
        T.boolean(),
        T.stringLit("4"),
      ])
    )
  ).toBe(true);
});
