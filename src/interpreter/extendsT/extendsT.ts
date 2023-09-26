import { P, match } from "ts-pattern";
import {
  Environment,
  extendEnvironment,
  addToEnvironment,
} from "../environment";
import { T, TypeNode, deepEquals } from "../type-node";

export type ExtendsTypeResult = {
  extends: boolean;
  inferredTypes: Environment;
};

const positiveExtendsResultWithoutInfer = (): ExtendsTypeResult => ({
  extends: true,
  inferredTypes: {},
});

export const extendsT = (
  env: Environment,
  t1: TypeNode,
  t2: TypeNode
): ExtendsTypeResult =>
  match<[TypeNode, TypeNode], ExtendsTypeResult>([t1, t2])
    // T extends T -> true
    .when(
      ([t1, t2]) => deepEquals(t1, t2),
      () => {
        return positiveExtendsResultWithoutInfer();
      }
    )

    // T extends infer X -> T with X = T
    .with([P._, { _type: "infer" }], ([t1, t2]) => ({
      extends: true,
      inferredTypes: addToEnvironment({}, t2.name, t1),
    }))

    // literals extends their sets
    .with([{ _type: "numberLiteral" }, { _type: "number" }], () =>
      positiveExtendsResultWithoutInfer()
    )
    .with([{ _type: "booleanLiteral" }, { _type: "boolean" }], () =>
      positiveExtendsResultWithoutInfer()
    )
    .with([{ _type: "stringLiteral" }, { _type: "string" }], () =>
      positiveExtendsResultWithoutInfer()
    )

    // Abstract types
    .with(
      [
        { _type: "any" },
        { _type: P.union("any", "unknown", "void", "undefined", "null") },
      ],
      () => positiveExtendsResultWithoutInfer()
    )
    .with([{ _type: "unknown" }, { _type: P.union("any", "unknown") }], () =>
      positiveExtendsResultWithoutInfer()
    )
    .with(
      [
        { _type: "void" },
        {
          _type: P.union("any", "unknown"),
        },
      ],
      () => positiveExtendsResultWithoutInfer()
    )
    .with(
      [
        { _type: "undefined" },
        {
          _type: P.union("any", "unknown", "void"),
        },
      ],
      () => positiveExtendsResultWithoutInfer()
    )
    .with(
      [
        { _type: "null" },
        {
          _type: P.union("any", "unknown"),
        },
      ],
      () => positiveExtendsResultWithoutInfer()
    )
    .with(
      [
        { _type: "never" },
        {
          _type: P.union("any", "unknown", "void", "undefined", "null"),
        },
      ],
      () => positiveExtendsResultWithoutInfer()
    )

    // EVERYTHING extends any and unknown
    .with([{ _type: P._ }, { _type: P.union("any", "unknown") }], () =>
      positiveExtendsResultWithoutInfer()
    )

    // TUPLES
    .with([{ _type: "tuple" }, { _type: "tuple" }], ([t1, t2]) => {
      return matchTuples(env, t1, t2);
    })

    .with([{ _type: "tuple" }, { _type: "array" }], ([t1, t2]) => {
      return {
        extends: t1.elements.every(
          (el) => extendsT(env, el, t2.elementType).extends
        ),
        inferredTypes: {},
      };
    })

    // UNION TYPE
    .with([P._, { _type: "union" }], ([t1, t2]) => {
      return {
        extends: t2.members.some((member) => extendsT(env, t1, member).extends),
        inferredTypes: {},
      };
    })

    .with([{ _type: "union" }, P._], ([t1, t2]) => {
      return {
        extends: t1.members.every(
          (member) => extendsT(env, member, t2).extends
        ),
        inferredTypes: {},
      };
    })

    // OBJECT TYPE
    .with([{ _type: "object" }, { _type: "object" }], ([t1, t2]) => {
      return matchObjectTypes(env, t1, t2);
    })

    // default to false
    .otherwise(() => {
      return {
        extends: false,
        inferredTypes: {},
      };
    });

function matchObjectTypes(
  env: Environment,
  t: Extract<TypeNode, { _type: "object" }>,
  shape: Extract<TypeNode, { _type: "object" }>
): ExtendsTypeResult {
  let justInferredTypes: Environment = {};

  // An object A can be assigned to an object B if it has at least all properties of B,
  // and they all contain assignable types.

  for (const [key, value] of Object.values(shape.properties)) {
    const correspondingType = t.properties.find(([k]) => deepEquals(k, key));
    // Object `t` is missing at least one property from `shape`, so it is not assignable
    if (!correspondingType) {
      return {
        extends: false,
        inferredTypes: {},
      };
    }

    // Of course, properties under corresponding keys must be assignable
    const result = extendsT(env, correspondingType[1], value);
    if (!result.extends) {
      return {
        extends: false,
        inferredTypes: {},
      };
    }
    justInferredTypes = extendEnvironment(
      justInferredTypes,
      result.inferredTypes
    );
  }
  return {
    extends: true,
    inferredTypes: justInferredTypes,
  };
}

function matchTuples(
  env: Environment,
  t: Extract<TypeNode, { _type: "tuple" }>,
  shape: Extract<TypeNode, { _type: "tuple" }>
): ExtendsTypeResult {
  let justInferredTypes: Environment = {};

  const restType = shape.elements.find((el) => el._type === "rest") as
    | undefined
    | Extract<TypeNode, { _type: "rest" }>; // there can be at most one rest type
  const includesRest = !!restType;

  // if the shape doesn't include a rest type, then the tuple must be the same length
  if (
    (t.elements.length === 0 && shape.elements.length > 1) ||
    (!includesRest && t.elements.length !== shape.elements.length)
  ) {
    return {
      extends: false,
      inferredTypes: {},
    };
  }

  let lastElemIdxFromFront = 0;
  let lastElemIdxFromBack = 0;

  while (
    lastElemIdxFromFront < shape.elements.length &&
    shape.elements[lastElemIdxFromFront]._type !== "rest"
  ) {
    const result = extendsT(
      extendEnvironment(env, justInferredTypes),
      t.elements[lastElemIdxFromFront],
      shape.elements[lastElemIdxFromFront]
    );
    if (!result.extends) {
      return {
        extends: false,
        inferredTypes: {},
      };
    }
    justInferredTypes = extendEnvironment(
      justInferredTypes,
      result.inferredTypes
    );
    lastElemIdxFromFront++;
  }

  // do the same thing, but from the back (if there is a rest type, otherwise we're done)
  if (includesRest) {
    while (
      lastElemIdxFromBack >= 0 &&
      shape.elements[shape.elements.length - 1 - lastElemIdxFromBack]._type !==
        "rest"
    ) {
      const result = extendsT(
        extendEnvironment(env, justInferredTypes),
        t.elements[t.elements.length - 1 - lastElemIdxFromBack],
        shape.elements[shape.elements.length - 1 - lastElemIdxFromBack]
      );
      if (!result.extends) {
        return {
          extends: false,
          inferredTypes: {},
        };
      }
      justInferredTypes = extendEnvironment(
        justInferredTypes,
        result.inferredTypes
      );
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
        inferredTypes: addToEnvironment(
          justInferredTypes,
          restType.type.name,
          inferredArr
        ),
      };
    } else if (restType.type._type === "array") {
      const result = extendsT(
        extendEnvironment(env, justInferredTypes),
        T.tuple(restTypeSubArray),
        restType.type
      );

      if (!result.extends) {
        return {
          extends: false,
          inferredTypes: {},
        };
      } else {
        return {
          extends: true,
          inferredTypes: {
            ...justInferredTypes,
            ...result.inferredTypes,
          },
        };
      }
    }
  }

  return {
    extends: true,
    inferredTypes: justInferredTypes,
  };
}
