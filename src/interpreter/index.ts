import * as ts from "typescript";
import { TypeNode } from "./TypeNode";
import { mapASTToTypeNodes } from "./mapASTToTypeNodes";
import { Result, err, ok } from "this-is-ok/result";

type TypeIdentifier = string;
export type Environment = {
  [k in TypeIdentifier]: TypeDeclaration;
};

export type TypeDeclaration = Extract<TypeNode, { _type: "typeDeclaration" }>;

export const createEnvironment = (
  sourceCode: string
): Result<Environment, Error> => {
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
    return err(e as Error);
  }

  return ok(env);
};

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
