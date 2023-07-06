export type TypeNode = { text: string } & (
  | {
      _type: "typeDeclaration";
      name: string;
      typeParameters: string[];
      type: TypeNode;
    }
  | { _type: "numberLiteral"; value: number }
  | { _type: "stringLiteral"; value: string }
  | { _type: "booleanLiteral"; value: boolean }
  | { _type: "tuple"; elements: TypeNode[] }
  | { _type: "typeReference"; name: string; typeArguments: TypeNode[] }
);
export type EvaluatedType = { isFullyEvaluated: boolean } & TypeNode;
