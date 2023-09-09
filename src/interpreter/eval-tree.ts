import { Do, Option, none, some } from "this-is-ok/option";
import {
  NodeId,
  TypeNode,
  deepEquals,
  findTypeNodeById,
  mapType,
  replaceNode,
} from "./type-node";
import {
  Environment,
  addToEnvironment,
  extendEnvironment,
  lookupType,
} from "./environment";
import { P, match } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { evalT } from "./evalT/eval-type";
import { extendsT } from "./extendsT/extendsT";

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
    | { _type: "simplifyUnion"; union: TypeNode };
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
      for (const [, v] of t.properties) {
        const res = chooseNodeToEval(env, v);
        if (res.isSome) {
          return res;
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
    .with(P.shape({ _type: "typeReference" }).select(), (tt) => {
      const typeDeclaration = env[tt.name];

      if (!typeDeclaration) {
        throw new Error(`Unknown type ${tt.name}`);
      }

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
            replacingType = lookupType(newEnv, replacingType.type.name).expect(
              "should have this type"
            );
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
      } as EvalStep);
    })

    .with(P.shape({ _type: "union" }).select(), (tt) =>
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

    .otherwise(() => {
      throw new Error(`unimplemented: ${nodeToEval._type}`);
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
        console.log("YO");
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
