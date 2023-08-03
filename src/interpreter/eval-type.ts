import { match, P } from "ts-pattern";
import { addToEnvironment, Environment } from "./environment";
import { EvaluatedType, T, TypeNode } from "./type-node";
import { err, ok, Result } from "this-is-ok/result";
import { extendsType } from "./extends-type";

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
      const elements = results.flatMap((el) => {
        if (el[0]._type === "rest") {
          const evaledRest = evalRestType(env, el[0]);
          if (evaledRest._type === "tuple") {
            return evaledRest.elements;
          } else {
            return evaledRest;
          }
        } else {
          return el[0];
        }
      }) as EvaluatedType[];
      const newEnv = results.reduce(
        (prevEnv, [, e]) => ({ ...prevEnv, ...e }),
        env
      );

      const isFullyEvaluated = elements.every(
        (element) => element?.isFullyEvaluated
      );

      return [
        {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ...T.tuple(elements.map(({ isFullyEvaluated, ...r }) => r)),
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
      console.error("CASE", type);
      throw new Error(`Unimplemented case: ${JSON.stringify(type, null, 2)}`);
    });

export const evalType = (
  env: Environment,
  type: TypeNode
): Result<TypeNode, Error> => {
  try {
    const [{ isFullyEvaluated, ...evaledType }, env2] = evalTypeOnce(
      env,
      intoEvaluatedType(type)
    );
    if (isFullyEvaluated) {
      return ok(evaledType);
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

function evalRestType(env: Environment, t: EvaluatedType): EvaluatedType {
  if (t._type === "rest") {
    const tt = evalType(env, t.type).unwrap();
    if (tt._type !== "tuple") {
      return t;
    }
    return {
      isFullyEvaluated: true,
      ...tt,
    } as Extract<EvaluatedType, { _type: "tuple" }>;
  } else {
    return t;
  }
}
