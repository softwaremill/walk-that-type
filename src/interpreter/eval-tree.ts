import { Do, Option, none, some } from "this-is-ok/option";
import {
  NodeId,
  T,
  TypeNode,
  deepEquals,
  findTypeNodeById,
  mapType,
  replaceNode,
  replaceTypeReference,
} from "./type-node";
import {
  Environment,
  addToEnvironment,
  extendEnvironment,
  lookupType,
} from "./environment";
import { P, match } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { accessType, evalT } from "./evalT/eval-type";
import { extendsT } from "./extendsT/extendsT";
import { intrinsicTypes } from "./evalT/intrinsic-types";
import { checkForDistributedUnion, distributeUnion } from "./distributed-union";

export type InferMapping = { [variableName: string]: TypeNode };

const isLeafType = (
  type: TypeNode
): type is Extract<
  TypeNode,
  | { _type: "string" }
  | { _type: "number" }
  | { _type: "boolean" }
  | { _type: "undefined" }
  | { _type: "typeDeclaration" }
  | { _type: "numberLiteral" }
  | { _type: "stringLiteral" }
  | { _type: "booleanLiteral" }
  | { _type: "null" }
  | { _type: "void" }
  | { _type: "any" }
  | { _type: "unknown" }
  | { _type: "never" }
  | { _type: "infer" }
> => {
  switch (type._type) {
    case "string":
    case "number":
    case "boolean":
    case "undefined":
    case "typeDeclaration":
    case "numberLiteral":
    case "stringLiteral":
    case "booleanLiteral":
    case "null":
    case "void":
    case "any":
    case "unknown":
    case "never":
    case "infer":
      return true;
  }

  return false;
};

export type EvalStep = {
  nodeToEval: NodeId;
  result: TypeNode;
  resultEnv: Environment;
  evalDescription:
    | {
        _type: "conditionalType";
        checkType: TypeNode;
        extendsType: TypeNode;
        extends: boolean;
      }
    | {
        _type: "conditionalType";
        checkType: TypeNode;
        extendsType: TypeNode;
        extends: true;
        inferredTypes: InferMapping;
      }
    | {
        _type: "substituteWithDefinition";
        name: string;
        evalTrace: EvalTrace;
      }
    | { _type: "applyRestOperator"; restElement: TypeNode }
    | { _type: "simplifyUnion"; union: TypeNode }
    | {
        _type: "useIntrinsicType";
        text: string;
        docsUrl: string;
      }
    | {
        _type: "distributiveUnion";
        typeName: string;
      }
    | {
        _type: "mappedType";
      }
    | {
        _type: "indexedAccessType";
      };
};

export type EvalTrace = [TypeNode, ...EvalStep[]];

const chooseNodeToEval = (env: Environment, node: TypeNode): Option<NodeId> => {
  return match(node)
    .when(
      (t) => isLeafType(t),
      () => none
    )
    .with({ _type: "array" }, (t) => chooseNodeToEval(env, t.elementType))
    .with({ _type: "object" }, (t) => {
      for (const [k, v] of t.properties) {
        const res = chooseNodeToEval(env, k);
        if (res.isSome) {
          return res;
        }

        const res2 = chooseNodeToEval(env, v);
        if (res2.isSome) {
          return res2;
        }
      }

      return none;
    })

    .with({ _type: "tuple" }, (t) => {
      for (const el of t.elements) {
        if (el._type === "rest") {
          if (el.type._type === "tuple") {
            return some(node.nodeId);
          }
          const nodeToEvalInRest = chooseNodeToEval(env, el.type);
          if (nodeToEvalInRest.isSome) {
            return nodeToEvalInRest;
          } else {
            return some(node.nodeId);
          }
        }

        const res = chooseNodeToEval(env, el);
        if (res.isSome) {
          return res;
        }
      }

      return none;
    })
    .with({ _type: "typeDeclaration" }, () => {
      throw new Error(`this shouldn't happen: ${node} in chooseNodeToEval`);
    })
    .with({ _type: "conditionalType" }, (t) => {
      // Before evaluating the conditional type, check if left-hand side or right-hand side
      // of extends needs to be evaluated. `thenType` or `elseType` will be evaluated
      // later down the line so it shouldn't be done here.
      const checkType = t.checkType;
      let res = chooseNodeToEval(env, checkType);
      if (res.isSome) {
        return res;
      }

      const extendsType = t.extendsType;
      res = chooseNodeToEval(env, extendsType);
      if (res.isSome) {
        return res;
      }

      return some(t.nodeId);
    })
    .with({ _type: "typeReference" }, (t) => some(t.nodeId))
    .with({ _type: "union" }, (t) => {
      for (const el of t.members) {
        const res = chooseNodeToEval(env, el);
        if (res.isSome) {
          return res;
        }
      }

      return evalT(env, t)
        .ok()
        .flatMap((simplified) => {
          if (deepEquals(simplified.type, t)) {
            return none;
          } else {
            return some(t.nodeId);
          }
        });
    })

    .with({ _type: "mappedType" }, (t) => {
      const res = chooseNodeToEval(env, t.constraint);
      if (res.isSome) {
        return res;
      }
      return some(t.nodeId);
    })

    .with({ _type: "indexedAccessType" }, (t) => {
      const res = chooseNodeToEval(env, t.objectType);
      if (res.isSome) {
        return res;
      }

      const res2 = chooseNodeToEval(env, t.indexType);
      if (res2.isSome) {
        return res2;
      }

      return some(t.nodeId);
    })
    .otherwise(() => {
      console.warn("???", node);
      return none;
    });
};

const calculateNextStep = (
  targetNodeId: NodeId,
  type: TypeNode,
  env: Environment
): Option<EvalStep> => {
  const nodeToEval = findTypeNodeById(type, targetNodeId).expect(
    "targetNodeId was not found in type"
  );
  return match(nodeToEval)
    .returnType<Option<EvalStep>>()
    .when(
      (t) => isLeafType(t),
      () => none
    )
    .with({ _type: P.union("array", "typeDeclaration") }, () => {
      throw new Error("this shouldn't happen");
    })
    .with(P.shape({ _type: "tuple" }).select(), (tt) => {
      const restEl = tt.elements.find((e) => e._type === "rest") as
        | Extract<TypeNode, { _type: "rest" }>
        | undefined;
      if (!restEl) {
        return none;
      }

      const newElements = tt.elements.flatMap((el) =>
        el.nodeId === restEl.nodeId
          ? restEl.type._type === "tuple"
            ? restEl.type.elements
            : []
          : el
      );

      const updatedTuple = { ...tt, elements: newElements, nodeId: uuid() };

      return some({
        nodeToEval: targetNodeId,
        result: replaceNode(type, targetNodeId, updatedTuple),
        resultEnv: env,
        evalDescription: {
          _type: "applyRestOperator",
          restElement: restEl,
        },
      } as EvalStep);
    })
    .with({ _type: "mappedType" }, (t) => {
      // ***we want to go from this:***
      // {
      //    [k in "a" | "b" as Uppercase<K>]: k
      // }
      //  ***to this:***
      // {
      //    [Uppercase<"a">]: "a",
      //    [Uppercase<"b"]: "b"
      // }
      // the form above is not a valid type in TS (keys can only be type literals),
      // but it could be a good visualization of what effectively going on under the hood

      // at this point the `t.constraint` should be evaled to the simplest union or a single type
      // this is the "a" | "b" from the example above
      const constraints =
        t.constraint._type === "union" ? t.constraint.members : [t.constraint];

      // this will be the `Uppercase<"a">, Uppercase<"b">` from the example above
      const lhss = constraints.map((c) => {
        const remapping = t.remapping;
        if (remapping) {
          return {
            ...replaceTypeReference(remapping, t.keyName, c),
            nodeId: uuid(),
          };
        } else {
          return c;
        }
      });

      // this will be the `"a", "b"` from the example above
      const rhss = constraints.map((c) => ({
        ...replaceTypeReference(t.type, t.keyName, c),
        nodeId: uuid(),
      }));

      // zip lhss and rhss together
      const newProperties = lhss.map(
        (lhs, idx) => [lhs, rhss[idx]] as [TypeNode, TypeNode]
      );

      const updated = T.object(newProperties);

      return some({
        nodeToEval: targetNodeId,
        result: replaceNode(type, targetNodeId, updated),
        resultEnv: env,
        evalDescription: {
          _type: "mappedType",
        },
      });
    })
    .with(P.shape({ _type: "conditionalType" }).select(), (tt) => {
      return Do(() => {
        const lhs = evalT(env, tt.checkType).ok().bind().type;
        const rhs = evalT(env, tt.extendsType).ok().bind().type;

        const result = extendsT(env, lhs, rhs);

        const evaluatedThenType = result.extends ? tt.thenType : tt.elseType;
        const newEnv = extendEnvironment(env, result.inferredTypes);

        const updated = mapType(evaluatedThenType, (tt) => {
          if (
            tt._type === "typeReference" &&
            Object.keys(result.inferredTypes).includes(tt.name)
          ) {
            let replacingType = lookupType(newEnv, tt.name).expect(
              "should have this type"
            );
            while (replacingType.type._type === "typeReference") {
              replacingType = lookupType(
                newEnv,
                replacingType.type.name
              ).expect("should have this type");
            }
            return { ...replacingType.type, nodeId: uuid() };
          } else {
            return tt;
          }
        });

        const hasInferredTypes = Object.keys(result.inferredTypes).length > 0;

        return some({
          nodeToEval: targetNodeId,
          result: replaceNode(type, targetNodeId, updated),
          resultEnv: env,
          evalDescription: result.extends
            ? {
                _type: "conditionalType",
                extends: true,
                checkType: tt.checkType,
                extendsType: tt.extendsType,
                inferredTypes: hasInferredTypes
                  ? result.inferredTypes
                  : undefined,
              }
            : {
                _type: "conditionalType",
                checkType: tt.checkType,
                extendsType: tt.extendsType,
                extends: false,
              },
        } as EvalStep);
      });
    })
    .when(
      (t) => t._type === "typeReference" && intrinsicTypes[t.name],
      (tt) => {
        if (tt._type !== "typeReference" || !intrinsicTypes[tt.name]) {
          throw new Error("impossible");
        }
        const standardTypeImpl = intrinsicTypes[tt.name];

        if (!standardTypeImpl) {
          throw new Error("impossible");
        }

        const newType = standardTypeImpl
          .fn(tt.typeArguments)
          .expect("Error while applying standard type");
        const fullyEvaled = evalT(env, newType).unwrap().type;

        return some({
          nodeToEval: targetNodeId,
          result: replaceNode(type, targetNodeId, fullyEvaled),
          resultEnv: env,
          evalDescription: {
            _type: "useIntrinsicType",
            text: `${tt.text()}`,
            docsUrl: standardTypeImpl.docsUrl,
            evalTrace: getEvalTrace(newType, env),
          },
        });
      }
    )
    .with(P.shape({ _type: "typeReference" }).select(), (tt) => {
      const typeDeclaration = env[tt.name];

      if (!typeDeclaration) {
        throw new Error(`Unknown type ${tt.name}`);
      }

      return match(checkForDistributedUnion(typeDeclaration, tt.typeArguments))
        .when(
          (indices) => indices.length > 0,
          (indices) => {
            const updated = distributeUnion(tt.name, tt.typeArguments, indices);

            return some({
              nodeToEval: targetNodeId,
              result: replaceNode(type, targetNodeId, updated),
              resultEnv: env,
              evalDescription: {
                _type: "distributiveUnion",
                typeName: tt.name,
              },
            } as const);
          }
        )
        .otherwise(() => {
          const newEnv = { ...env };
          typeDeclaration.typeParameters.forEach((ty, idx) => {
            addToEnvironment(newEnv, ty, tt.typeArguments[idx]);
          });

          const updated = mapType(typeDeclaration.type, (tt) => {
            if (
              tt._type === "typeReference" &&
              typeDeclaration.typeParameters.includes(tt.name)
            ) {
              let replacingType = lookupType(newEnv, tt.name).expect(
                "should have this type"
              );
              while (
                replacingType.type._type === "typeReference" &&
                replacingType.type.name !== typeDeclaration.name
              ) {
                replacingType = lookupType(
                  newEnv,
                  replacingType.type.name
                ).expect("should have this type");
              }
              return { ...replacingType.type, nodeId: uuid() };
            } else {
              return tt;
            }
          });

          const fullyEvaled = evalT(newEnv, typeDeclaration.type).unwrap().type;

          return some({
            nodeToEval: targetNodeId,
            result: replaceNode(type, targetNodeId, fullyEvaled),
            resultEnv: newEnv,
            evalDescription: {
              _type: "substituteWithDefinition",
              name: `${tt.text()}`,
              evalTrace: getEvalTrace(updated, newEnv),
            },
          });
        });
    })

    .with({ _type: "union" }, (tt) =>
      evalT(env, tt)
        .ok()
        .map((t) => ({
          nodeToEval: targetNodeId,
          result: replaceNode(type, targetNodeId, t.type),
          resultEnv: env,
          evalDescription: {
            _type: "simplifyUnion",
            union: tt,
          },
        }))
    )

    .with({ _type: "indexedAccessType" }, (tt) => {
      return Do(() => {
        const accessedType = accessType(tt.objectType, tt.indexType)
          .ok()
          .bind();

        return some({
          nodeToEval: targetNodeId,
          result: replaceNode(type, targetNodeId, accessedType),
          resultEnv: env,
          evalDescription: {
            _type: "indexedAccessType",
          },
        });
      });
    })

    .otherwise(() => {
      console.error(`unimplemented: ${nodeToEval._type}`);
      return none;
    });
};

const EVAL_LIMIT = 1_000;

export const getEvalTrace = (
  startingType: TypeNode,
  startingEnv: Environment
): EvalTrace => {
  const result: EvalTrace = [startingType];
  let currentStep: Option<EvalStep>;
  let currentType = startingType;
  let currentEnv = startingEnv;
  for (let i = 0; i < EVAL_LIMIT; i++) {
    currentStep = chooseNodeToEval(currentEnv, currentType).flatMap(
      (nodeId) => {
        return calculateNextStep(nodeId, currentType, currentEnv);
      }
    );
    if (currentStep.isNone) {
      break;
    } else {
      result.push(currentStep.value);
      currentType = currentStep.value.result;
      currentEnv = currentStep.value.resultEnv;
    }
  }

  return result;
};
