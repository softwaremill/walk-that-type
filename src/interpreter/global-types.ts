import type { Environment, TypeDeclaration } from "./environment";
import { T } from "./type-node";

export const globalTypes: Environment = {
  Exclude: T.typeDeclaration(
    "Exclude",
    ["T", "U"],
    T.conditionalType(
      T.typeReference("T", []),
      T.typeReference("U", []),
      T.never(),
      T.typeReference("T", [])
    )
  ) as TypeDeclaration,
  Extract: T.typeDeclaration(
    "Extract",
    ["T", "U"],
    T.conditionalType(
      T.typeReference("T", []),
      T.typeReference("U", []),
      T.typeReference("T", []),
      T.never()
    )
  ) as TypeDeclaration,
  // Pick: T.typeDeclaration(
  //   "Pick",
  //   ["T", "K"],
  //   T.mappedType("P", T.typeReference("K", []), )
  //   )
  // ) as TypeDeclaration,
  // Omit: T.typeDeclaration(
  //   "Omit",
  //   ["T", "K"],
  //   T.conditionalType(
  //     T.typeReference("T", []),
  //     T.typeReference("U", []),
  //     T.typeReference("T", []),
  //     T.never()
  //   )
  // ) as TypeDeclaration,
};
