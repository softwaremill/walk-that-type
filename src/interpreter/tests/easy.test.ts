import { expect, test } from "vitest";
import { createEnvironment } from "../environment";
import { evalT } from "../evalT/eval-type";
import { T, deepEquals } from "../type-node";
import {
  TYPE_TO_EVAL_IDENTIFIER,
  createTypeToEval,
} from "../type-node/create-type-to-eval";

test("First", () => {
  const env = createEnvironment(
    `type First<T extends any[]> = T extends [infer Head, ...any] ? Head : never;`
  ).unwrap();

  expect(
    deepEquals(
      evalT(
        env,
        createTypeToEval(
          `type ${TYPE_TO_EVAL_IDENTIFIER} = First<[1, 2, 3]>`
        ).unwrap()
      ).unwrap().type,
      T.numberLit(1)
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalT(
        env,
        createTypeToEval(
          `type ${TYPE_TO_EVAL_IDENTIFIER} = First<[42]>`
        ).unwrap()
      ).unwrap().type,
      T.numberLit(42)
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalT(
        env,
        createTypeToEval(`type ${TYPE_TO_EVAL_IDENTIFIER} = First<[]>`).unwrap()
      ).unwrap().type,
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
      evalT(
        env,
        createTypeToEval(
          `type ${TYPE_TO_EVAL_IDENTIFIER} = Last<[1, 2, 3]>`
        ).unwrap()
      ).unwrap().type,
      T.numberLit(3)
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalT(
        env,
        createTypeToEval(
          `type ${TYPE_TO_EVAL_IDENTIFIER} = Last<[42]>`
        ).unwrap()
      ).unwrap().type,
      T.numberLit(42)
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalT(
        env,
        createTypeToEval(`type ${TYPE_TO_EVAL_IDENTIFIER} = Last<[]>`).unwrap()
      ).unwrap().type,
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
      evalT(
        env,
        createTypeToEval(
          `type ${TYPE_TO_EVAL_IDENTIFIER} = Concat<[], []>`
        ).unwrap()
      ).unwrap().type,
      T.tuple([])
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalT(
        env,
        createTypeToEval(
          `type ${TYPE_TO_EVAL_IDENTIFIER} = Concat<[], [1]>`
        ).unwrap()
      ).unwrap().type,
      T.tuple([T.numberLit(1)])
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalT(
        env,
        createTypeToEval(
          `type ${TYPE_TO_EVAL_IDENTIFIER} = Concat<[1, 2], [3, 4]>`
        ).unwrap()
      ).unwrap().type,
      T.tuple([T.numberLit(1), T.numberLit(2), T.numberLit(3), T.numberLit(4)])
    )
  ).toBe(true);
  expect(
    deepEquals(
      evalT(
        env,
        createTypeToEval(
          `type ${TYPE_TO_EVAL_IDENTIFIER} = Concat<["1", 2, "3"], [false, boolean, "4"]>`
        ).unwrap()
      ).unwrap().type,
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
