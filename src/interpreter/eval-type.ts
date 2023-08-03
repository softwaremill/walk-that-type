import { match, P } from "ts-pattern";
import {
  addToEnvironment,
  Environment,
  extendEnvironment,
} from "./environment";
import { T, TypeNode } from "./type-node";
import { Do, err, ok, Result } from "this-is-ok/result";
import { extendsType } from "./extends-type";
import { sequence } from "./map-AST-to-type-nodes";

export const evalT = (
  env: Environment,
  type: TypeNode
): Result<{ type: TypeNode; env: Environment }, Error> =>
  match(type)
    .returnType<Result<{ type: TypeNode; env: Environment }, Error>>()
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
      (type) => ok({ type, env })
    )
    .with({ _type: "array" }, (t) =>
      evalT(env, t.elementType).map(({ type, env }) => ({
        type: T.array(type),
        env,
      }))
    )
    .with({ _type: "conditionalType" }, (t) =>
      Do(() => {
        const lhs = evalT(env, t.checkType).bind().type;
        const rhs = evalT(env, t.extendsType).bind().type;

        const extendsResult = extendsType(env, lhs, rhs);
        const newEnv = extendEnvironment(env, extendsResult.inferredTypes);

        return extendsResult.extends
          ? evalT(newEnv, t.thenType)
          : evalT(newEnv, t.elseType);
      })
    )
    .with({ _type: "tuple" }, (t) => {
      return sequence(
        t.elements.map((element) => evalT(env, element).map(({ type }) => type))
      ).map((results) => {
        const elements = results.flatMap((el) => {
          if (el._type === "rest") {
            const evaledRest = evalRestType(env, el);
            if (evaledRest._type === "tuple") {
              return evaledRest.elements;
            } else {
              return evaledRest;
            }
          } else {
            return el;
          }
        });

        return { type: T.tuple(elements), env };
      });
    })
    .with({ _type: "typeReference" }, (t) => {
      const typeDeclaration = env[t.name];
      if (!typeDeclaration) {
        return err(new Error(`unknown type ${t.name}`));
      }

      const newEnv = { ...env };
      typeDeclaration.typeParameters.forEach((ty, idx) => {
        addToEnvironment(newEnv, ty, t.typeArguments[idx]);
      });

      return evalT(newEnv, typeDeclaration.type);
    })
    .otherwise(() => {
      console.error("unhandled type", type);
      return err(new Error("unhandled type in evalT"));
    });

function evalRestType(env: Environment, t: TypeNode): TypeNode {
  if (t._type === "rest") {
    const tt = evalT(env, t.type).unwrap().type;
    if (tt._type !== "tuple") {
      return t;
    }
    return tt;
  } else {
    return t;
  }
}
