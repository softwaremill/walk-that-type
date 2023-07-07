import { match, P } from "ts-pattern";
import { addToEnvironment, Environment } from "./environment";
import { EvaluatedType, T, TypeNode } from "./TypeNode";
import { err, ok, Result } from "this-is-ok/result";
import { extendsType } from "./extendsType";

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
          "never",
          "infer",
          "rest"
        ),
      },
      (t) => [fullyEvaled(t), env]
    )
    .with({ _type: "array" }, (t) => {
      const [evaledType, newEnv] = evalTypeOnce(
        env,
        intoEvaluatedType(t.elementType)
      );
      return [
        {
          ...T.array(evaledType),
          isFullyEvaluated: evaledType.isFullyEvaluated,
        },
        newEnv,
      ];
    })
    .with({ _type: "conditionalType" }, (t) => {
      const lhs = evalType(env, t.checkType).unwrap();
      const rhs = evalType(env, t.extendsType).unwrap();

      const result = extendsType(env, lhs, rhs);
      const newEnv = { ...env, ...result.inferredTypes };
      if (result.extends) {
        return [
          {
            ...evalType(newEnv, intoEvaluatedType(t.thenType)).unwrap(),
            isFullyEvaluated: false,
          },
          newEnv,
        ];
      } else {
        return [
          {
            ...evalType(newEnv, intoEvaluatedType(t.elseType)).unwrap(),
            isFullyEvaluated: false,
          },
          newEnv,
        ];
      }
    })
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
      console.log("AAA", typeDeclaration);
      typeDeclaration.typeParameters.forEach((ty, idx) => {
        addToEnvironment(newEnv, ty, t.typeArguments[idx]);
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
