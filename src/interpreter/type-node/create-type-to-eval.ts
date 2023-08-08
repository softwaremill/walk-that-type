import { Result, err } from "this-is-ok/result";
import { TypeNode } from ".";
import ts from "typescript";
import { mapASTToTypeNodes } from "./map-AST-to-type-nodes";

export const createTypeToEval = (
  sourceCode: string
): Result<TypeNode, Error> => {
  const sourceFile = ts.createSourceFile(
    "b.ts",
    `type __dummy = ${sourceCode}`,
    ts.ScriptTarget.Latest,
    /*setParentNodes */ true
  );

  let node: Result<TypeNode, Error> = err(new Error("No type found"));

  sourceFile.forEachChild((child) => {
    if (ts.isTypeAliasDeclaration(child)) {
      node = mapASTToTypeNodes(child.type);
    }
  });

  return node;
};
