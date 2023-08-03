import * as ts from "typescript";
import { TypeNode } from "./type-node";
import { mapASTToTypeNodes } from "./map-AST-to-type-nodes";
import { Result, err } from "this-is-ok/result";

export type TypeDeclaration = Extract<TypeNode, { _type: "typeDeclaration" }>;
export type ConditionalType = Extract<TypeNode, { _type: "conditionalType" }>;

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

ts.SyntaxKind;
