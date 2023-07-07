import { P, match } from "ts-pattern";
import { Environment } from ".";
import { T, TypeNode } from "./TypeNode";

export type ExtendsTypeResult = {
  extends: boolean;
  inferredTypes: Environment;
};

const deepEquals = (t1: TypeNode, t2: TypeNode): boolean =>
  JSON.stringify(t1) === JSON.stringify(t2);

const positiveExtendsResultWithoutInfer = (
  env: Environment
): ExtendsTypeResult => ({
  extends: true,
  inferredTypes: env,
});

export const extendsType = (
  env: Environment,
  t1: TypeNode,
  t2: TypeNode
): ExtendsTypeResult =>
  match<[TypeNode, TypeNode], ExtendsTypeResult>([t1, t2])
    // T extends T -> true
    .when(
      ([t1, t2]) => deepEquals(t1, t2),
      () => positiveExtendsResultWithoutInfer(env)
    )

    // T extends infer X -> T with X = T
    .with([P._, { _type: "infer" }], ([t1, t2]) => ({
      extends: true,
      inferredTypes: { ...env, [t2.name]: t1 } as Environment,
    }))

    // literals extends their sets
    .with([{ _type: "numberLiteral" }, { _type: "number" }], () =>
      positiveExtendsResultWithoutInfer(env)
    )
    .with([{ _type: "booleanLiteral" }, { _type: "boolean" }], () =>
      positiveExtendsResultWithoutInfer(env)
    )
    .with([{ _type: "stringLiteral" }, { _type: "string" }], () =>
      positiveExtendsResultWithoutInfer(env)
    )

    // Abstract types
    .with(
      [
        { _type: "any" },
        { _type: P.union("any", "unknown", "void", "undefined", "null") },
      ],
      () => positiveExtendsResultWithoutInfer(env)
    )
    .with([{ _type: "unknown" }, { _type: P.union("any", "unknown") }], () =>
      positiveExtendsResultWithoutInfer(env)
    )
    .with(
      [
        { _type: "void" },
        {
          _type: P.union("any", "unknown"),
        },
      ],
      () => positiveExtendsResultWithoutInfer(env)
    )
    .with(
      [
        { _type: "undefined" },
        {
          _type: P.union("any", "unknown", "void"),
        },
      ],
      () => positiveExtendsResultWithoutInfer(env)
    )
    .with(
      [
        { _type: "null" },
        {
          _type: P.union("any", "unknown"),
        },
      ],
      () => positiveExtendsResultWithoutInfer(env)
    )
    .with(
      [
        { _type: "never" },
        {
          _type: P.union("any", "unknown", "void", "undefined", "null"),
        },
      ],
      () => positiveExtendsResultWithoutInfer(env)
    )

    // EVERYTHING extends any and unknown
    .with([{ _type: P._ }, { _type: P.union("any", "unknown") }], () =>
      positiveExtendsResultWithoutInfer(env)
    )

    // TUPLES
    .with([{ _type: "tuple" }, { _type: "tuple" }], ([t1, t2]) => {
      return matchTuples(env, t1, t2);
    })

    .with([{ _type: "tuple" }, { _type: "array" }], ([t1, t2]) => {
      return {
        extends: t1.elements.every(
          (el) => extendsType(env, el, t2.elementType).extends
        ),
        inferredTypes: env,
      };
    })

    // default to false
    .otherwise(() => {
      return {
        extends: false,
        inferredTypes: env,
      };
    });

function matchTuples(
  env: Environment,
  t: Extract<TypeNode, { _type: "tuple" }>,
  shape: Extract<TypeNode, { _type: "tuple" }>
): ExtendsTypeResult {
  let newEnv: Environment = { ...env };
  const restType = shape.elements.find((el) => el._type === "rest") as
    | undefined
    | Extract<TypeNode, { _type: "rest" }>; // there can be at most one rest type
  const includesRest = !!restType;

  // if the shape doesn't include a rest type, then the tuple must be the same length
  if (!includesRest && t.elements.length !== shape.elements.length) {
    return {
      extends: false,
      inferredTypes: env,
    };
  }

  let lastElemIdxFromFront = 0;
  let lastElemIdxFromBack = 0;

  while (
    lastElemIdxFromFront < shape.elements.length &&
    shape.elements[lastElemIdxFromFront]._type !== "rest"
  ) {
    const result = extendsType(
      newEnv,
      t.elements[lastElemIdxFromFront],
      shape.elements[lastElemIdxFromFront]
    );
    if (!result.extends) {
      return {
        extends: false,
        inferredTypes: env,
      };
    }
    newEnv = result.inferredTypes;
    lastElemIdxFromFront++;
  }

  // do the same thing, but from the back (if there is a rest type, otherwise we're done)
  if (includesRest) {
    while (
      lastElemIdxFromBack >= 0 &&
      shape.elements[shape.elements.length - 1 - lastElemIdxFromBack]._type !==
        "rest"
    ) {
      const result = extendsType(
        newEnv,
        t.elements[t.elements.length - 1 - lastElemIdxFromBack],
        shape.elements[shape.elements.length - 1 - lastElemIdxFromBack]
      );
      if (!result.extends) {
        return {
          extends: false,
          inferredTypes: env,
        };
      }
      newEnv = result.inferredTypes;
      lastElemIdxFromBack--;
    }
  }

  // extract the part of the tuple that is the rest type and check that it extends the rest type in the shape
  if (includesRest) {
    const restTypeSubArray = t.elements.slice(
      lastElemIdxFromFront,
      t.elements.length - 1 - lastElemIdxFromBack + 1
    );

    // rest shape is either an array or infer keyword
    if (restType.type._type === "infer") {
      const inferredArr = T.tuple(restTypeSubArray);
      return {
        extends: true,
        inferredTypes: {
          ...newEnv,
          [restType.type.name]: inferredArr,
        } as Environment,
      };
    } else if (restType.type._type === "array") {
      return extendsType(newEnv, T.tuple(restTypeSubArray), restType.type);
    }
  }

  return {
    extends: true,
    inferredTypes: newEnv,
  };
}
