import ts from "typescript";
import { TypeNode } from "./TypeNode";

export const mapASTToTypeNodes = (node: ts.Node): TypeNode => {
  if (ts.isTypeAliasDeclaration(node)) {
    return {
      _type: "typeDeclaration",
      text: node.getText().trim(),
      name: node.name.getText().trim(),
      type: mapASTToTypeNodes(node.type),
    };
  } else if (ts.isLiteralTypeNode(node)) {
    if (ts.isNumericLiteral(node.literal)) {
      return {
        _type: "numberLiteral",
        text: node.getText().trim(),
        value: Number(node.literal.text),
      };
    } else if (ts.isStringLiteral(node.literal)) {
      return {
        _type: "stringLiteral",
        text: node.getText().trim(),
        value: node.literal.text,
      };
    } else if (node.literal.kind === ts.SyntaxKind.TrueKeyword) {
      return {
        _type: "booleanLiteral",
        text: node.getText().trim(),
        value: true,
      };
    } else if (node.literal.kind === ts.SyntaxKind.FalseKeyword) {
      return {
        _type: "booleanLiteral",
        text: node.getText().trim(),
        value: false,
      };
    } else {
      throw new Error(`Unsupported literal type ${ts.SyntaxKind[node.kind]}`);
    }
  } else if (ts.isTupleTypeNode(node)) {
    return {
      _type: "tuple",
      text: node.getText().trim(),
      elements: node.elements.map(mapASTToTypeNodes),
    };
  } else if (ts.isTypeReferenceNode(node)) {
    return {
      _type: "typeReference",
      text: node.getText().trim(),
      name: node.typeName.getText().trim(),
      typeArguments: node.typeArguments?.map(mapASTToTypeNodes) ?? [],
    };
  } else {
    throw new Error(`Unsupported type ${ts.SyntaxKind[node.kind]}`);
  }
};
