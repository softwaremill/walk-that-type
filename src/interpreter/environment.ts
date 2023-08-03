import { Result, err, ok } from "this-is-ok/result";
import { TypeDeclaration } from ".";
import ts from "typescript";
import { mapASTToTypeNodes } from "./map-AST-to-type-nodes";
import { T, TypeNode } from "./type-node";
import { Option, of } from "this-is-ok/option";

export type TypeIdentifier = string;
export type Environment = {
  [k in TypeIdentifier]: TypeDeclaration;
};

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

export const addToEnvironment = (
  env: Environment,
  name: TypeIdentifier,
  type: TypeNode,
  typeParams: string[] = []
) => {
  env[name] = T.typeDeclaration(name, typeParams, type) as TypeDeclaration;
  return env;
};

export const extendEnvironment = (env: Environment, newEnv: Environment) => ({
  ...env,
  ...newEnv,
});

export const lookupType = (
  env: Environment,
  name: TypeIdentifier
): Option<TypeDeclaration> => of(env[name]);
