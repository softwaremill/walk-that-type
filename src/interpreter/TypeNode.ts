import { v4 as uuid } from "uuid";

export type NodeId = string;

export type TypeNode = { text: string; nodeId: NodeId } & (
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
  nodeId: uuid(),
});

const numberLit = (value: number): TypeNode => ({
  _type: "numberLiteral",
  value,
  text: `${value}`,
  nodeId: uuid(),
});

const stringLit = (value: string): TypeNode => ({
  _type: "stringLiteral",
  value,
  text: `"${value}"`,
  nodeId: uuid(),
});

const booleanLit = (value: boolean): TypeNode => ({
  _type: "booleanLiteral",
  value,
  text: `${value}`,
  nodeId: uuid(),
});

const tuple = (types: TypeNode[]): TypeNode => ({
  _type: "tuple",
  elements: types,
  text: `[${types.map((t) => t.text).join(", ")}]`,
  nodeId: uuid(),
});

const typeReference = (name: string, args: TypeNode[]): TypeNode => ({
  _type: "typeReference",
  name,
  typeArguments: args,
  text: `${name}${
    args.length > 0 ? "<" + args.map((a) => a.text).join(", ") + ">" : ""
  }`,
  nodeId: uuid(),
});

const number = (): TypeNode => ({
  _type: "number",
  text: "number",
  nodeId: uuid(),
});

const string = (): TypeNode => ({
  _type: "string",
  text: "string",
  nodeId: uuid(),
});

const boolean = (): TypeNode => ({
  _type: "boolean",
  text: "boolean",
  nodeId: uuid(),
});

const nullKeyword = (): TypeNode => ({
  _type: "null",
  text: "null",

  nodeId: uuid(),
});

const undefinedKeyword = (): TypeNode => ({
  _type: "undefined",
  text: "undefined",
  nodeId: uuid(),
});

const voidKeyword = (): TypeNode => ({
  _type: "void",
  text: "void",
  nodeId: uuid(),
});

const anyKeyword = (): TypeNode => ({
  _type: "any",
  text: "any",
  nodeId: uuid(),
});

const neverKeyword = (): TypeNode => ({
  _type: "never",
  text: "never",
  nodeId: uuid(),
});

const unknownKeyword = (): TypeNode => ({
  _type: "unknown",
  text: "unknown",
  nodeId: uuid(),
});

const union = (members: TypeNode[]): TypeNode => ({
  _type: "union",
  members,
  text: members.map((m) => m.text).join(" | "),
  nodeId: uuid(),
});

const intersection = (members: TypeNode[]): TypeNode => ({
  _type: "intersection",
  members,
  text: members.map((m) => m.text).join(" & "),
  nodeId: uuid(),
});

const infer = (variableName: string): TypeNode => ({
  _type: "infer",
  name: variableName,
  text: `infer ${variableName}`,
  nodeId: uuid(),
});

const rest = (type: TypeNode): TypeNode => ({
  _type: "rest",
  type,
  text: `...${type.text}`,
  nodeId: uuid(),
});

const array = (elementType: TypeNode): TypeNode => ({
  _type: "array",
  elementType,
  text: `${elementType.text}[]`,
  nodeId: uuid(),
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
  text: `${checkType.text} extends ${extendsType.text} 
  ? ${thenType.text} 
  : ${elseType.text}`,
  nodeId: uuid(),
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
