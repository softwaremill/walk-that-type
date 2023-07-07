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
  | { _type: "array"; elementType: TypeNode }
  | { _type: "typeReference"; name: string; typeArguments: TypeNode[] }
  // most primitive types
  | { _type: "number" }
  | { _type: "string" }
  | { _type: "boolean" }
  | { _type: "null" }
  | { _type: "undefined" }
  | { _type: "void" }
  // special types
  | { _type: "any" }
  | { _type: "unknown" }
  | { _type: "never" }
  // unions & intersections
  | { _type: "union"; members: TypeNode[] }
  | { _type: "intersection"; members: TypeNode[] }
  | {
      _type: "conditionalType";
      checkType: TypeNode;
      extendsType: TypeNode;
      thenType: TypeNode;
      elseType: TypeNode;
    }
  | {
      _type: "infer";
      name: string;
    }
  | {
      _type: "rest";
      type: TypeNode;
    }
);
export type EvaluatedType = { isFullyEvaluated: boolean } & TypeNode;

const typeDeclaration = (
  name: string,
  params: string[],
  type: TypeNode
): TypeNode => ({
  _type: "typeDeclaration",
  name,
  typeParameters: params,
  type,
  text: `type ${name}<${params.join(", ")}> = ${type}`,
});

const numberLit = (value: number): TypeNode => ({
  _type: "numberLiteral",
  value,
  text: `${value}`,
});

const stringLit = (value: string): TypeNode => ({
  _type: "stringLiteral",
  value,
  text: `"${value}"`,
});

const booleanLit = (value: boolean): TypeNode => ({
  _type: "booleanLiteral",
  value,
  text: `${value}`,
});

const tuple = (types: TypeNode[]): TypeNode => ({
  _type: "tuple",
  elements: types,
  text: `[${types.map((t) => t.text).join(", ")}]`,
});

const typeReference = (name: string, args: TypeNode[]): TypeNode => ({
  _type: "typeReference",
  name,
  typeArguments: args,
  text: `${name}${args.length > 0 ? "<" + args.join(", ") + ">" : ""}`,
});

const number = {
  _type: "number",
  text: "number",
} as TypeNode;

const string = {
  _type: "string",
  text: "string",
} as TypeNode;

const boolean = {
  _type: "boolean",
  text: "boolean",
} as TypeNode;

const nullKeyword = {
  _type: "null",
  text: "null",
} as TypeNode;

const undefinedKeyword = {
  _type: "undefined",
  text: "undefined",
} as TypeNode;

const voidKeyword = {
  _type: "void",
  text: "void",
} as TypeNode;

const anyKeyword = {
  _type: "any",
  text: "any",
} as TypeNode;

const neverKeyword = {
  _type: "never",
  text: "never",
} as TypeNode;

const unknownKeyword = {
  _type: "unknown",
  text: "unknown",
} as TypeNode;

const union = (members: TypeNode[]): TypeNode => ({
  _type: "union",
  members,
  text: members.map((m) => m.text).join(" | "),
});

const intersection = (members: TypeNode[]): TypeNode => ({
  _type: "intersection",
  members,
  text: members.map((m) => m.text).join(" & "),
});

const infer = (variableName: string): TypeNode => ({
  _type: "infer",
  name: variableName,
  text: `infer ${variableName}`,
});

const rest = (type: TypeNode): TypeNode => ({
  _type: "rest",
  type,
  text: `...${type.text}`,
});

const array = (elementType: TypeNode): TypeNode => ({
  _type: "array",
  elementType,
  text: `${elementType.text}[]`,
});

const conditionalType = (
  checkType: TypeNode,
  extendsType: TypeNode,
  thenType: TypeNode,
  elseType: TypeNode
): TypeNode => ({
  _type: "conditionalType",
  checkType,
  extendsType,
  thenType,
  elseType,
  text: `${checkType} extends ${extendsType} ? ${thenType} : ${elseType}`,
});

export const T = {
  typeDeclaration,
  numberLit,
  stringLit,
  booleanLit,
  tuple,
  typeReference,
  number,
  string,
  boolean,
  null: nullKeyword,
  undefined: undefinedKeyword,
  void: voidKeyword,
  any: anyKeyword,
  unknown: unknownKeyword,
  never: neverKeyword,
  union,
  intersection,
  conditionalType,
  infer,
  rest,
  array,
};
