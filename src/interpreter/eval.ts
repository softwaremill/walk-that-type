import { match, P } from "ts-pattern";
import { Environment } from ".";
import { EvaluatedType, TypeNode } from "./TypeNode";

const fullyEvaled = (type: EvaluatedType): EvaluatedType => ({
  ...type,
  isFullyEvaluated: true,
});

const intoEvaluatedType = (type: TypeNode): EvaluatedType => ({
  ...type,
  isFullyEvaluated: false,
});

export const evalTypeOnce = (
  env: Environment,
  type: EvaluatedType
): [EvaluatedType, Environment] =>
  match<EvaluatedType, [EvaluatedType, Environment]>(type)
    .with(
      { _type: P.union("booleanLiteral", "stringLiteral", "numberLiteral") },
      (t) => [fullyEvaled(t), env]
    )
    .with({ _type: "tuple" }, (t) => {
      const elements = t.elements.map(
        (element) => evalTypeOnce(env, intoEvaluatedType(element))[0]
      );

      const isFullyEvaluated = elements.every(
        (element) => element.isFullyEvaluated
      );

      return [{ ...t, elements, isFullyEvaluated }, env];
    })
    .with({ _type: "typeReference" }, (t) => {
      console.log("env222", env);
      const typeDeclaration = env.find(
        (ty): ty is Extract<TypeNode, { _type: "typeDeclaration" }> =>
          ty._type === "typeDeclaration" && ty.name === t.name
      );

      if (!typeDeclaration) {
        throw new Error(`Unknown type ${t.name}`);
      }

      return [
        {
          ...typeDeclaration.type,
          isFullyEvaluated: false,
        },
        [
          ...env,
          ...typeDeclaration.typeParameters.map(
            (ty, idx): TypeNode => ({
              _type: "typeDeclaration",
              name: ty,
              type: t.typeArguments[idx],
              text: `type ${ty} = ${t.typeArguments[idx].text}`,
              typeParameters: [],
            })
          ),
        ],
      ];
    })
    .otherwise(() => {
      throw new Error(`Unimplemented case: ${type}`);
    });

export const evalType = (env: Environment, type: TypeNode): TypeNode => {
  const [evaledType, env2] = evalTypeOnce(env, intoEvaluatedType(type));
  if (evaledType.isFullyEvaluated) {
    return evaledType;
  }

  return evalType(env2, evaledType);
};
