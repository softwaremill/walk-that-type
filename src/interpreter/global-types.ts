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
};
