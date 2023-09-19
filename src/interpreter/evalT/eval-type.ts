import { match, P } from "ts-pattern";
import {
  addToEnvironment,
  Environment,
  extendEnvironment,
} from "../environment";
import { deepEquals, T, TypeNode } from "../type-node";
import { Do, err, ok, Result } from "this-is-ok/result";
import { sequence } from "../type-node/map-AST-to-type-nodes";
import { extendsT } from "../extendsT/extendsT";
import { standardTypes } from "./global-types";

const removeDuplicates = (arr: TypeNode[]): TypeNode[] => {
  const uniq: TypeNode[] = [];
  arr.forEach((el) => {
    if (!uniq.some((u) => deepEquals(el, u))) {
      uniq.push(el);
    }
  });

  return uniq;
};

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

    .with({ _type: "object" }, (t) =>
      sequence(
        t.properties.map(([k, v]) =>
          evalT(env, v).map(({ type }) => [k, type] as const)
        )
      ).map((props) => ({
        type: T.object(props as [string, TypeNode][]),
        env,
      }))
    )

    .with({ _type: "conditionalType" }, (t) =>
      Do(() => {
        const lhs = evalT(env, t.checkType).bind().type;
        const rhs = evalT(env, t.extendsType).bind().type;

        const extendsResult = extendsT(env, lhs, rhs);
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
      const globalTypeImpl = standardTypes[t.name];
      if (globalTypeImpl) {
        return globalTypeImpl.fn(t.typeArguments).flatMap((type) => {
          return evalT(env, type);
        });
      }

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

    .with({ _type: "union" }, (t) => {
      return sequence(
        t.members.map((type) => evalT(env, type).map(({ type }) => type))
      ).map((evaledTypes) => {
        // remove duplicated types and filter out never
        let withoutDuplicates = removeDuplicates(evaledTypes).filter(
          (t) => t._type !== "never"
        );

        // unknown and any are the most general types
        if (withoutDuplicates.some((t) => t._type === "any")) {
          return { type: T.any(), env };
        }
        if (withoutDuplicates.some((t) => t._type === "unknown")) {
          return { type: T.unknown(), env };
        }

        // simplify true | false to boolean
        if (
          withoutDuplicates.some((t) => deepEquals(t, T.booleanLit(true))) &&
          withoutDuplicates.some((t) => deepEquals(t, T.booleanLit(false)))
        ) {
          withoutDuplicates = withoutDuplicates.filter(
            (t) =>
              !deepEquals(t, T.booleanLit(true)) &&
              !deepEquals(t, T.booleanLit(false))
          );
          withoutDuplicates.push(T.boolean());
        }

        // if there is only one type, return it
        return withoutDuplicates.length === 1
          ? { type: withoutDuplicates[0], env }
          : { type: T.union(withoutDuplicates), env };
      });
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
