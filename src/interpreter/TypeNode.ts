import { Option, none, some } from "this-is-ok/option";
import { v4 as uuid } from "uuid";
import { Environment } from "./environment";

export type NodeId = string;

export type TypeNode = { text: () => string; nodeId: NodeId } & (
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
  text: () =>
    params.length > 0
      ? `type ${name}<${params.join(", ")}> = ${type.text()}`
      : `type ${name} = ${type.text()}`,
  nodeId: uuid(),
});

const numberLit = (value: number): TypeNode => ({
  _type: "numberLiteral",
  value,
  text: () => `${value}`,
  nodeId: uuid(),
});

const stringLit = (value: string): TypeNode => ({
  _type: "stringLiteral",
  value,
  text: () => `"${value}"`,
  nodeId: uuid(),
});

const booleanLit = (value: boolean): TypeNode => ({
  _type: "booleanLiteral",
  value,
  text: () => `${value}`,
  nodeId: uuid(),
});

const tuple = (types: TypeNode[]): TypeNode => ({
  _type: "tuple",
  elements: types,
  text: () => `[${types.map((t) => t.text()).join(", ")}]`,
  nodeId: uuid(),
});

const typeReference = (name: string, args: TypeNode[]): TypeNode => ({
  _type: "typeReference",
  name,
  typeArguments: args,
  text: () =>
    `${name}${
      args.length > 0 ? "<" + args.map((a) => a.text()).join(", ") + ">" : ""
    }`,
  nodeId: uuid(),
});

const number = (): TypeNode => ({
  _type: "number",
  text: () => "number",
  nodeId: uuid(),
});

const string = (): TypeNode => ({
  _type: "string",
  text: () => "string",
  nodeId: uuid(),
});

const boolean = (): TypeNode => ({
  _type: "boolean",
  text: () => "boolean",
  nodeId: uuid(),
});

const nullKeyword = (): TypeNode => ({
  _type: "null",
  text: () => "null",

  nodeId: uuid(),
});

const undefinedKeyword = (): TypeNode => ({
  _type: "undefined",
  text: () => "undefined",
  nodeId: uuid(),
});

const voidKeyword = (): TypeNode => ({
  _type: "void",
  text: () => "void",
  nodeId: uuid(),
});

const anyKeyword = (): TypeNode => ({
  _type: "any",
  text: () => "any",
  nodeId: uuid(),
});

const neverKeyword = (): TypeNode => ({
  _type: "never",
  text: () => "never",
  nodeId: uuid(),
});

const unknownKeyword = (): TypeNode => ({
  _type: "unknown",
  text: () => "unknown",
  nodeId: uuid(),
});

const union = (members: TypeNode[]): TypeNode => ({
  _type: "union",
  members,
  text: () => members.map((m) => m.text()).join(" | "),
  nodeId: uuid(),
});

const intersection = (members: TypeNode[]): TypeNode => ({
  _type: "intersection",
  members,
  text: () => members.map((m) => m.text()).join(" & "),
  nodeId: uuid(),
});

const infer = (variableName: string): TypeNode => ({
  _type: "infer",
  name: variableName,
  text: () => `infer ${variableName}`,
  nodeId: uuid(),
});

const rest = (type: TypeNode): TypeNode => ({
  _type: "rest",
  type,
  text: () => `...${type.text()}`,
  nodeId: uuid(),
});

const array = (elementType: TypeNode): TypeNode => ({
  _type: "array",
  elementType,
  text: () => `${elementType.text()}[]`,
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
  text: () => `${checkType.text()} extends ${extendsType.text()} 
  ? ${thenType.text()} 
  : ${elseType.text()}`,
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

export const traverse = (type: TypeNode, f: (t: TypeNode) => void) => {
  switch (type._type) {
    case "string":
    case "number":
    case "boolean":
    case "undefined":
    case "numberLiteral":
    case "stringLiteral":
    case "booleanLiteral":
    case "null":
    case "void":
    case "any":
    case "unknown":
    case "never":
      f(type);
      break;

    case "tuple":
      f(type);
      type.elements.forEach((e) => traverse(e, f));
      break;

    case "array":
      f(type);
      f(type.elementType);
      break;

    case "typeReference":
      f(type);
      type.typeArguments.forEach((a) => traverse(a, f));
      break;

    case "union":
      f(type);
      type.members.forEach((m) => traverse(m, f));
      break;

    case "intersection":
      f(type);
      type.members.forEach((m) => traverse(m, f));
      break;

    case "conditionalType":
      f(type);
      traverse(type.checkType, f);
      traverse(type.extendsType, f);
      traverse(type.thenType, f);
      traverse(type.elseType, f);
      break;

    case "rest":
      f(type);
      traverse(type.type, f);
      break;

    case "infer":
      break;

    case "typeDeclaration":
      break;
  }
};

export const mapType = (
  type: TypeNode,
  f: (t: TypeNode) => TypeNode
): TypeNode => {
  switch (type._type) {
    case "string":
    case "number":
    case "boolean":
    case "undefined":
    case "numberLiteral":
    case "stringLiteral":
    case "booleanLiteral":
    case "null":
    case "void":
    case "any":
    case "unknown":
    case "never":
      return f(type);

    case "tuple": {
      const result = f(type);
      if (result !== type) {
        return result;
      }

      const elements = type.elements.map((el) => mapType(el, f));
      return {
        ...type,
        elements,
      };
    }

    case "array":
      return {
        ...type,
        elementType: mapType(type.elementType, f),
      };

    case "typeReference": {
      if (type.typeArguments.length === 0) {
        return f(type);
      } else {
        const res = f(type);
        if (res !== type) {
          return res;
        }
        const typeArguments = type.typeArguments.map((a) => mapType(a, f));
        return {
          ...type,
          typeArguments,
        };
      }
    }

    case "union": {
      const members = type.members.map((m) => mapType(m, f));
      return {
        ...type,
        members,
      };
    }

    case "intersection": {
      const members = type.members.map((m) => mapType(m, f));
      return {
        ...type,
        members,
      };
    }

    case "conditionalType": {
      const checkType = mapType(type.checkType, f);
      const extendsType = mapType(type.extendsType, f);
      const thenType = mapType(type.thenType, f);
      const elseType = mapType(type.elseType, f);

      return {
        ...type,
        checkType,
        extendsType,
        thenType,
        elseType,
      };
    }

    case "rest":
      return {
        ...type,
        type: mapType(type.type, f),
      };

    case "infer":
    case "typeDeclaration":
      return type;
  }
};

export const findTypeNodeById = (t: TypeNode, id: NodeId): Option<TypeNode> => {
  if (t.nodeId === id) {
    return some(t);
  }
  let result: Option<TypeNode> = none;
  traverse(t, (t) => {
    if (t.nodeId === id) {
      result = some(t);
    }
  });
  return result;
};

export const updateTypeNode = (
  root: TypeNode,
  id: NodeId,
  f: (t: TypeNode) => [TypeNode, Environment]
): [TypeNode, Environment] => {
  let env: Environment = {};
  traverse(root, (t) => {
    if (t.nodeId === id) {
      const [newT, newEnv] = f(t);
      Object.assign(t, newT);
      env = newEnv;
    }
  });

  return [{ ...root }, env];
};

export const replaceNode = (
  root: TypeNode,
  id: NodeId,
  newNode: TypeNode
): TypeNode => {
  if (root.nodeId === id) {
    return newNode;
  }
  return mapType(root, (t) => {
    if (t.nodeId === id) {
      return newNode;
    }
    return t;
  });
};

export const printTypeNode = (t: TypeNode): string => {
  switch (t._type) {
    case "string":
    case "number":
    case "boolean":
    case "undefined":
    case "numberLiteral":
    case "stringLiteral":
    case "booleanLiteral":
    case "null":
    case "void":
    case "any":
    case "unknown":
    case "never":
      return t.text();

    case "tuple":
      return `[${t.elements.map(printTypeNode).join(", ")}]`;

    case "array":
      return `${printTypeNode(t.elementType)}[]`;

    case "typeReference":
      return `${t.name}${
        t.typeArguments.length > 0
          ? "<" + t.typeArguments.map(printTypeNode).join(", ") + ">"
          : ""
      }`;

    case "union":
      return t.members.map(printTypeNode).join(" | ");

    case "intersection":
      return t.members.map(printTypeNode).join(" & ");

    case "conditionalType":
      return `${printTypeNode(t.checkType)} extends ${printTypeNode(
        t.extendsType
      )} ? ${printTypeNode(t.thenType)} : ${printTypeNode(t.elseType)}`;

    case "rest":
      return `...${printTypeNode(t.type)}`;

    case "infer":
      return `infer ${t.name}`;

    case "typeDeclaration":
      return `type ${t.name} = ${printTypeNode(t.type)}`;
  }
};
