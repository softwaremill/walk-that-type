import { cartesianProduct } from "../utils/cartesianProduct";
import { TypeDeclaration } from "./environment";
import { T, TypeNode, traverse } from "./type-node";

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

export type IndicesOfUnionsToDistribute = number[];

export const checkForDistributedUnion = (
  typeDeclaration: TypeDeclaration,
  typeArguments: TypeNode[]
): IndicesOfUnionsToDistribute =>
  typeDeclaration.typeParameters.reduce((acc, val, idx) => {
    if (typeArguments[idx]?._type !== "union") {
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
  }, [] as IndicesOfUnionsToDistribute);

export const distributeUnion = (
  typeName: string,
  typeArguments: TypeNode[],
  indicesToDistribute: IndicesOfUnionsToDistribute
): TypeNode => {
  // Map t.typeArguments so that distributed unions are mapped to nested arrays.
  // The rest is transformed into a singleton.
  const args = typeArguments.map((tt, idx) =>
    tt._type === "union" && indicesToDistribute.includes(idx)
      ? tt.members
      : [tt]
  );

  const argsSets = cartesianProduct(...args);
  // return union of t.name (type reference) with each set of arguments from cartesian product
  return T.union(argsSets.map((set) => T.typeReference(typeName, set)));
};
