import { expect, test } from "vitest";
import { createEnvironment } from "../environment";
import { createTypeToEval } from "..";
import { evalType } from "../eval";
import { T } from "../TypeNode";

test("First", () => {
  const env = createEnvironment(
    `type First<T extends any[]> = T extends [infer Head, ...any] ? Head : never;`
  ).unwrap();

  expect(
    evalType(env, createTypeToEval(`First<[1, 2, 3]>`).unwrap()).unwrap()
  ).toEqual(T.numberLit(1));
  expect(
    evalType(env, createTypeToEval(`First<[42]>`).unwrap()).unwrap()
  ).toEqual(T.numberLit(42));
  expect(
    evalType(env, createTypeToEval(`First<[]>`).unwrap()).unwrap()
  ).toEqual(T.never);
});

test("Last", () => {
  const env = createEnvironment(
    `type Last<T extends any[]> = T extends [...any, infer L] ? L : never;`
  ).unwrap();

  expect(
    evalType(env, createTypeToEval(`Last<[1, 2, 3]>`).unwrap()).unwrap()
  ).toEqual(T.numberLit(3));
  expect(
    evalType(env, createTypeToEval(`Last<[42]>`).unwrap()).unwrap()
  ).toEqual(T.numberLit(42));
  expect(evalType(env, createTypeToEval(`Last<[]>`).unwrap()).unwrap()).toEqual(
    T.never
  );
});

test("Concat", () => {
  const env = createEnvironment(
    `type Concat<T extends any[], U extends any[]> = [...T, ...U];`
  ).unwrap();

  expect(
    evalType(env, createTypeToEval(`Concat<[], []>`).unwrap()).unwrap()
  ).toEqual(T.tuple([]));
  expect(
    evalType(env, createTypeToEval(`Concat<[], [1]>`).unwrap()).unwrap()
  ).toEqual(T.tuple([T.numberLit(1)]));
  expect(
    evalType(env, createTypeToEval(`Concat<[1, 2], [3, 4]>`).unwrap()).unwrap()
  ).toEqual(
    T.tuple([T.numberLit(1), T.numberLit(2), T.numberLit(3), T.numberLit(4)])
  );
  expect(
    evalType(
      env,
      createTypeToEval(`Concat<["1", 2, "3"], [false, boolean, "4"]>`).unwrap()
    ).unwrap()
  ).toEqual(
    T.tuple([
      T.stringLit("1"),
      T.numberLit(2),
      T.stringLit("3"),
      T.booleanLit(false),
      T.boolean,
      T.stringLit("4"),
    ])
  );
});
