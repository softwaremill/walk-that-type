import { match, P } from "ts-pattern";
import { Environment } from ".";
import { EvaluatedType, T, TypeNode } from "./TypeNode";
import { err, ok, Result } from "this-is-ok/result";

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
      {
        _type: P.union(
          "booleanLiteral",
          "stringLiteral",
          "numberLiteral",
          "number",
          "string",
          "boolean",
          "null",
          "undefined",
          "void",
          "any",
          "unknown",
          "never"
        ),
      },
      (t) => [fullyEvaled(t), env]
    )
    .with({ _type: "tuple" }, (t) => {
      const results = t.elements.map((element) =>
        evalTypeOnce(env, intoEvaluatedType(element))
      );
      const elements = results.map((el) => el[0]);
      const newEnv = results.reduce(
        (prevEnv, [, e]) => ({ ...prevEnv, ...e }),
        env
      );

      const isFullyEvaluated = elements.every(
        (element) => element.isFullyEvaluated
      );

      return [
        {
          ...T.tuple(elements),
          isFullyEvaluated,
        },
        newEnv,
      ];
    })
    .with({ _type: "union" }, (t) => {
      const results = t.members.map((element) =>
        evalTypeOnce(env, intoEvaluatedType(element))
      );
      const elements = results.map((el) => el[0]);
      const newEnv = results.reduce(
        (prevEnv, [, e]) => ({ ...prevEnv, ...e }),
        env
      );

      const isFullyEvaluated = elements.every(
        (element) => element.isFullyEvaluated
      );

      // TODO: eliminate union members that are subtypes of each other after I implement extends

      return [
        {
          ...T.union(elements),
          isFullyEvaluated,
        },
        newEnv,
      ];
    })
    .with({ _type: "typeReference" }, (t) => {
      const typeDeclaration = env[t.name];

      if (!typeDeclaration) {
        throw new Error(`Unknown type ${t.name}`);
      }

      const newEnv = { ...env };
      typeDeclaration.typeParameters.forEach((ty, idx) => {
        newEnv[ty] = {
          _type: "typeDeclaration",
          name: ty,
          type: t.typeArguments[idx],
          text: `type ${ty} = ${t.typeArguments[idx].text}`,
          typeParameters: [],
        };
      });

      return [
        {
          ...typeDeclaration.type,
          isFullyEvaluated: false,
        },
        newEnv,
      ];
    })
    .otherwise(() => {
      throw new Error(`Unimplemented case: ${JSON.stringify(type, null, 2)}`);
    });

export const evalType = (
  env: Environment,
  type: TypeNode
): Result<TypeNode, Error> => {
  try {
    const [evaledType, env2] = evalTypeOnce(env, intoEvaluatedType(type));
    if (evaledType.isFullyEvaluated) {
      return ok(evaledType as TypeNode);
    }

    return evalType(env2, evaledType);
  } catch (e) {
    if (e instanceof Error) {
      return err(e);
    } else if (typeof e === "string") {
      return err(new Error(e));
    } else {
      return err(new Error("Unknown error"));
    }
  }
};
