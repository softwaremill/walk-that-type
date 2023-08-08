import ts from "typescript";
import { T, TypeNode } from ".";
import { Result, err, ok } from "this-is-ok/result";

export const sequence = <T, E>(opts: Result<T, E>[]): Result<T[], E> => {
  const error = opts.find((el) => el.isErr);
  if (error) {
    return err(error.unwrapErr()) as unknown as Result<T[], E>;
  }

  return ok(opts.map((o) => o.unwrap()));
};

export const mapASTToTypeNodes = (node: ts.Node): Result<TypeNode, Error> => {
  if (ts.isTypeAliasDeclaration(node)) {
    return mapASTToTypeNodes(node.type).map((type) =>
      T.typeDeclaration(
        node.name.getText().trim(),
        node.typeParameters?.map((param) => param.name.getText()) ?? [],
        type
      )
    );
  } else if (ts.isConditionalTypeNode(node)) {
    return mapASTToTypeNodes(node.checkType).do((checkType) => {
      return ok(
        T.conditionalType(
          checkType,
          mapASTToTypeNodes(node.extendsType).bind(),
          mapASTToTypeNodes(node.trueType).bind(),
          mapASTToTypeNodes(node.falseType).bind()
        )
      );
    });
  } else if (ts.isInferTypeNode(node)) {
    return ok(T.infer(node.typeParameter.name.getText()));
  } else if (ts.isArrayTypeNode(node)) {
    return mapASTToTypeNodes(node.elementType).map(T.array);
  } else if (ts.isRestTypeNode(node)) {
    return mapASTToTypeNodes(node.type).map(T.rest);
  } else if (ts.isUnionTypeNode(node)) {
    return sequence(node.types.map(mapASTToTypeNodes)).map(T.union);
  } else if (ts.isIntersectionTypeNode(node)) {
    return sequence(node.types.map(mapASTToTypeNodes)).map(T.intersection);
  } else if (node.kind === ts.SyntaxKind.NumberKeyword) {
    return ok(T.number());
  } else if (node.kind === ts.SyntaxKind.StringKeyword) {
    return ok(T.string());
  } else if (node.kind === ts.SyntaxKind.BooleanKeyword) {
    return ok(T.boolean());
  } else if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
    return ok(T.undefined());
  } else if (node.kind === ts.SyntaxKind.VoidKeyword) {
    return ok(T.void());
  } else if (node.kind === ts.SyntaxKind.AnyKeyword) {
    return ok(T.any());
  } else if (node.kind === ts.SyntaxKind.UnknownKeyword) {
    return ok(T.unknown());
  } else if (node.kind === ts.SyntaxKind.NeverKeyword) {
    return ok(T.never());
  } else if (ts.isLiteralTypeNode(node)) {
    if (ts.isNumericLiteral(node.literal)) {
      return ok(T.numberLit(Number(node.literal.text)));
    } else if (ts.isStringLiteral(node.literal)) {
      return ok(T.stringLit(node.literal.text));
    } else if (node.literal.kind === ts.SyntaxKind.TrueKeyword) {
      return ok(T.booleanLit(true));
    } else if (node.literal.kind === ts.SyntaxKind.FalseKeyword) {
      return ok(T.booleanLit(false));
    } else if (node.literal.kind === ts.SyntaxKind.NullKeyword) {
      return ok(T.null());
    } else {
      return err(
        new Error(`Unsupported literal type ${ts.SyntaxKind[node.kind]}`)
      );
    }
  } else if (ts.isTupleTypeNode(node)) {
    return sequence(node.elements.map(mapASTToTypeNodes)).map(T.tuple);
  } else if (ts.isTypeReferenceNode(node)) {
    return sequence(node.typeArguments?.map(mapASTToTypeNodes) ?? []).map(
      (args) => T.typeReference(node.typeName.getText().trim(), args)
    );
  } else {
    return err(new Error(`Unsupported type ${ts.SyntaxKind[node.kind]}`));
  }
};
