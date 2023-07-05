import * as ts from "typescript";
import { TypeNode } from "./TypeNode";
import { mapASTToTypeNodes } from "./mapASTToTypeNodes";

export type Environment = TypeNode[];

export const createEnvironment = (sourceCode: string): Environment => {
  const sourceFile = ts.createSourceFile(
    "a.ts",
    sourceCode,
    ts.ScriptTarget.Latest,
    /*setParentNodes */ true
  );

  const nodes: TypeNode[] = [];
  sourceFile.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      nodes.push(mapASTToTypeNodes(node));
    }
  });

  return nodes;
};

export const createTypeToEval = (sourceCode: string): TypeNode | null => {
  const sourceFile = ts.createSourceFile(
    "b.ts",
    `type __dummy = ${sourceCode}`,
    ts.ScriptTarget.Latest,
    /*setParentNodes */ true
  );

  let node: TypeNode | null = null;

  sourceFile.forEachChild((child) => {
    if (ts.isTypeAliasDeclaration(child)) {
      node = mapASTToTypeNodes(child.type);
    }
  });

  return node;
};

ts.SyntaxKind;
