import ts from "typescript";
import { T, TypeNode } from "./TypeNode";
import { Option, none, some } from "this-is-ok/option";

// TODO: add this to this-is-ok
const sequence = <T>(opts: Option<T>[]): Option<T[]> => {
  if (opts.some((el) => el.isNone)) {
    return none;
  }

  return some(opts.map((o) => o.unwrap()));
};

export const mapASTToTypeNodes = (node: ts.Node): Option<TypeNode> => {
  console.log(node);
  if (ts.isTypeAliasDeclaration(node)) {
    return mapASTToTypeNodes(node.type).map(
      (type): TypeNode => ({
        _type: "typeDeclaration",
        typeParameters:
          node.typeParameters?.map((param) => param.name.getText()) ?? [],
        text: node.getText().trim(),
        name: node.name.getText().trim(),
        type,
      })
    );
  } else if (ts.isUnionTypeNode(node)) {
    return sequence(node.types.map(mapASTToTypeNodes)).map(T.union);
  } else if (ts.isIntersectionTypeNode(node)) {
    return sequence(node.types.map(mapASTToTypeNodes)).map(T.union);
  } else if (node.kind === ts.SyntaxKind.NumberKeyword) {
    return some(T.number);
  } else if (node.kind === ts.SyntaxKind.StringKeyword) {
    return some(T.string);
  } else if (node.kind === ts.SyntaxKind.BooleanKeyword) {
    return some(T.boolean);
  } else if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
    return some(T.undefined);
  } else if (node.kind === ts.SyntaxKind.VoidKeyword) {
    return some(T.void);
  } else if (node.kind === ts.SyntaxKind.AnyKeyword) {
    return some(T.any);
  } else if (node.kind === ts.SyntaxKind.UnknownKeyword) {
    return some(T.unknown);
  } else if (node.kind === ts.SyntaxKind.NeverKeyword) {
    return some(T.never);
  } else if (ts.isLiteralTypeNode(node)) {
    if (ts.isNumericLiteral(node.literal)) {
      return some(T.numberLit(Number(node.literal.text)));
    } else if (ts.isStringLiteral(node.literal)) {
      return some(T.stringLit(node.literal.text));
    } else if (node.literal.kind === ts.SyntaxKind.TrueKeyword) {
      return some(T.booleanLit(true));
    } else if (node.literal.kind === ts.SyntaxKind.FalseKeyword) {
      return some(T.booleanLit(false));
    } else if (node.literal.kind === ts.SyntaxKind.NullKeyword) {
      return some(T.null);
    } else {
      throw new Error(`Unsupported literal type ${ts.SyntaxKind[node.kind]}`);
    }
  } else if (ts.isTupleTypeNode(node)) {
    return sequence(node.elements.map(mapASTToTypeNodes)).map(T.tuple);
  } else if (ts.isTypeReferenceNode(node)) {
    return sequence(node.typeArguments?.map(mapASTToTypeNodes) ?? []).map(
      (args) => T.typeReference(node.typeName.getText().trim(), args)
    );
  } else {
    throw new Error(`Unsupported type ${ts.SyntaxKind[node.kind]}`);
  }
};
