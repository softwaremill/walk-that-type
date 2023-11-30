import { Do, Result, ok } from "this-is-ok/result";
import ts from "typescript";
import { mapASTToTypeNodes } from "./type-node/map-AST-to-type-nodes";
import { T, TypeNode } from "./type-node";
import { Option, of } from "this-is-ok/option";
import { globalTypes } from "./global-types";

export type TypeDeclaration = Extract<TypeNode, { _type: "typeDeclaration" }>;

export type TypeIdentifier = string;
export type Environment = {
  [k in TypeIdentifier]: TypeDeclaration;
};

export const createEnvironment = (
  sourceCode: string
): Result<Environment, Error> =>
  Do(() => {
    const sourceFile = ts.createSourceFile(
      "a.ts",
      sourceCode,
      ts.ScriptTarget.Latest,
      /*setParentNodes */ true
    );

    const env: Environment = {};
    sourceFile.forEachChild((node) => {
      if (ts.isTypeAliasDeclaration(node)) {
        env[node.name.getText()] = mapASTToTypeNodes(
          node
        ).bind() as TypeDeclaration;
      }
    });

    const envWithGlobalTypes = extendEnvironment(env, globalTypes);

    return ok(envWithGlobalTypes);
  });

export const addToEnvironment = (
  env: Environment,
  name: TypeIdentifier,
  type: TypeNode,
  typeParams: string[] = []
) => {
  env[name] = T.typeDeclaration(name, typeParams, type) as TypeDeclaration;
  return env;
};

export const extendEnvironment = (
  env: Environment,
  newEnv: Environment
): Environment => ({
  ...env,
  ...newEnv,
});

export const lookupType = (
  env: Environment,
  name: TypeIdentifier
): Option<TypeDeclaration> => of(env[name]);
