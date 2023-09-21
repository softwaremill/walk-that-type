import { match, P } from "ts-pattern";
import {
  addToEnvironment,
  Environment,
  extendEnvironment,
} from "../environment";
import { deepEquals, T, traverse, TypeNode } from "../type-node";
import { Do, err, ok, Result } from "this-is-ok/result";
import { sequence } from "../type-node/map-AST-to-type-nodes";
import { extendsT } from "../extendsT/extendsT";
import { intrinsicTypes } from "./intrinsic-types";
import { cartesianProduct } from "../../utils/cartesianProduct";

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
      const intrinsicTypeImpl = intrinsicTypes[t.name];
      if (intrinsicTypeImpl) {
        return intrinsicTypeImpl.fn(t.typeArguments).flatMap((type) => {
          return evalT(env, type);
        });
      }

      const typeDeclaration = env[t.name];
      if (!typeDeclaration) {
        return err(new Error(`unknown type ${t.name}`));
      }

      // This part below is for handling distributed unions.
      // For example:
      // type ToArray<Type> = Type extends any ? Type[] : never;
      //                      ^ typeDeclaration.type
      // ToArray<string | number>
      //         ^ t.typeArguments[0]
      // This should evaluate to -> ToArray<string> | ToArray<number>
      // So string[] | number[] and not (string | number)[]
      // A generic type distributes over its arguments if:
      // 1. the argument is a union type
      // 2. It's used on the left-hand side of a conditional type as a ***naked type***.
      // The conditional type could be nested arbitrarily deep inside the type.

      // Indices of t.typeArguments that are unions and need to be distributed.
      // To calculate that, we need to traverse `typeDeclaration.type` and check if
      // there is a conditional type with naked t.typeArgument (we do it for each t.typeArguments).
      const indicesOfUnionsToDistribute = typeDeclaration.typeParameters.reduce(
        (acc, val, idx) => {
          if (t.typeArguments[idx]?._type !== "union") {
            return acc;
          }
          traverse(typeDeclaration.type, (tt) => {
            if (
              tt._type === "conditionalType" &&
              tt.checkType._type === "typeReference" &&
              tt.checkType.name === val
            ) {
              if (!acc.includes(idx)) {
                acc.push(idx);
              }
            }
          });

          return acc;
        },
        [] as number[]
      );

      if (indicesOfUnionsToDistribute.length > 0) {
        // Map t.typeArguments so that distributed unions are mapped to nested arrays.
        // The rest is transformed into a singleton.
        const args = t.typeArguments.map((tt, idx) =>
          tt._type === "union" && indicesOfUnionsToDistribute.includes(idx)
            ? tt.members
            : [tt]
        );

        const argsSets = cartesianProduct(...args);
        // return union of t.name (type reference) with each set of arguments from cartesian product
        return evalT(
          env,
          T.union(argsSets.map((set) => T.typeReference(t.name, set)))
        );
      }
      // end of distributed unions

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
