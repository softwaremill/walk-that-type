import { Result, err } from "this-is-ok/result";
import { TypeNode } from ".";
import ts from "typescript";
import { mapASTToTypeNodes } from "./map-AST-to-type-nodes";

export const TYPE_TO_EVAL_IDENTIFIER = "_wtt";

export const createTypeToEval = (
  sourceCode: string
): Result<TypeNode, Error> => {
  const sourceFile = ts.createSourceFile(
    "b.ts",
    `${sourceCode}`,
    ts.ScriptTarget.Latest,
    /*setParentNodes */ true
  );

  let node: Result<TypeNode, Error> = err(new Error("No type found"));

  sourceFile.forEachChild((child) => {
    if (ts.isTypeAliasDeclaration(child)) {
      if (child.name.getText() === TYPE_TO_EVAL_IDENTIFIER) {
        node = mapASTToTypeNodes(child.type);
      }
    }
  });

  return node;
};
