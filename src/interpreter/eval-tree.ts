import { Do, Option, none, some } from "this-is-ok/option";
import {
  NodeId,
  TypeNode,
  findTypeNodeById,
  mapType,
  replaceNode,
} from "./TypeNode";
import {
  Environment,
  addToEnvironment,
  extendEnvironment,
  lookupType,
} from "./environment";
import { P, match } from "ts-pattern";
import { extendsType } from "./extendsType";
import { evalType } from "./eval";

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
  evalTrace: EvalTrace;
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
    | { _type: "substituteWithDefinition"; name: string };
};

export type EvalTrace = [TypeNode, ...EvalStep[]];

const chooseNodeToEval = (node: TypeNode): Option<NodeId> => {
  return match(node)
    .when(
      (t) => isLeafType(t),
      () => none
    )
    .with({ _type: "array" }, (t) => chooseNodeToEval(t.elementType))
    .with({ _type: "tuple" }, (t) => {
      const el = t.elements.find((e) => !isLeafType(e));
      return el ? some(el.nodeId) : none;
    })
    .with({ _type: "typeDeclaration" }, () => {
      throw new Error("this shouldn't happen");
    })
    .with({ _type: "conditionalType" }, (t) => {
      return some(t.nodeId);
    })
    .with({ _type: "typeReference" }, (t) => some(t.nodeId))
    .otherwise(() => none);
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
    .with({ _type: P.union("array", "tuple", "typeDeclaration") }, () => {
      throw new Error("this shouldn't happen");
    })
    .with(P.shape({ _type: "conditionalType" }).select(), (tt) => {
      return Do(() => {
        const lhs = evalType(env, tt.checkType).ok().bind();
        const rhs = evalType(env, tt.extendsType).ok().bind();

        const result = extendsType(env, lhs, rhs);

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
            return replacingType.type;
          } else {
            return tt;
          }
        });

        const hasInferredTypes = Object.keys(result.inferredTypes).length > 0;

        return some({
          nodeToEval: targetNodeId,
          result: replaceNode(type, targetNodeId, updated),
          resultEnv: env,
          evalTrace: [replaceNode(type, targetNodeId, updated)] as EvalTrace,
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
          while (replacingType.type._type === "typeReference") {
            replacingType = lookupType(newEnv, replacingType.type.name).expect(
              "should have this type"
            );
          }
          return replacingType.type;
        } else {
          return tt;
        }
      });

      return some({
        nodeToEval: targetNodeId,
        result: replaceNode(type, targetNodeId, updated),
        resultEnv: newEnv,
        evalTrace: [replaceNode(type, targetNodeId, updated)] as EvalTrace,
        evalDescription: {
          _type: "substituteWithDefinition",
          name: typeDeclaration.name,
        },
      } as EvalStep);
    })
    .otherwise(() => {
      throw new Error("unimplemented");
    });
};

const EVAL_LIMIT = 10_000;

export const getEvalTrace = (
  startingType: TypeNode,
  startingEnv: Environment
): EvalTrace => {
  const result: EvalTrace = [startingType];
  let currentStep: Option<EvalStep>;
  let currentType = startingType;
  let currentEnv = startingEnv;
  for (let i = 0; i < EVAL_LIMIT; i++) {
    currentStep = chooseNodeToEval(currentType).flatMap((nodeId) => {
      return calculateNextStep(nodeId, currentType, currentEnv);
    });
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
