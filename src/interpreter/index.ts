import * as ts from "typescript";
import { TypeNode } from "./TypeNode";
import { mapASTToTypeNodes } from "./mapASTToTypeNodes";
import { Option, none, some } from "this-is-ok/option";

type TypeIdentifier = string;
export type Environment = {
  [k in TypeIdentifier]: TypeDeclaration;
};

export type TypeDeclaration = Extract<TypeNode, { _type: "typeDeclaration" }>;

export const createEnvironment = (sourceCode: string): Option<Environment> => {
  const sourceFile = ts.createSourceFile(
    "a.ts",
    sourceCode,
    ts.ScriptTarget.Latest,
    /*setParentNodes */ true
  );

  const env: Environment = {};
  try {
    sourceFile.forEachChild((node) => {
      if (ts.isTypeAliasDeclaration(node)) {
        env[node.name.getText()] = mapASTToTypeNodes(
          node
        ).unwrap() as TypeDeclaration;
      }
    });
  } catch (e) {
    return none;
  }

  return some(env);
};

export const createTypeToEval = (sourceCode: string): Option<TypeNode> => {
  const sourceFile = ts.createSourceFile(
    "b.ts",
    `type __dummy = ${sourceCode}`,
    ts.ScriptTarget.Latest,
    /*setParentNodes */ true
  );

  let node: Option<TypeNode> = none;

  sourceFile.forEachChild((child) => {
    if (ts.isTypeAliasDeclaration(child)) {
      node = mapASTToTypeNodes(child.type);
    }
  });

  return node;
};

ts.SyntaxKind;
