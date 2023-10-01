/* eslint-disable @typescript-eslint/no-unused-vars */
import { Option, none, some } from "this-is-ok/option";
import { v4 as uuid } from "uuid";
import { P, match } from "ts-pattern";

export type NodeId = string;

type TypeNodeBase<T> = T &
  (
    | {
        _type: "typeDeclaration";
        name: string;
        typeParameters: string[];
        type: TypeNodeBase<T>;
      }
    | { _type: "numberLiteral"; value: number }
    | { _type: "stringLiteral"; value: string }
    | { _type: "booleanLiteral"; value: boolean }
    | {
        _type: "object";
        properties: [key: TypeNodeBase<T>, value: TypeNodeBase<T>][];
      }
    | { _type: "tuple"; elements: TypeNodeBase<T>[] }
    | { _type: "array"; elementType: TypeNodeBase<T> }
    | { _type: "typeReference"; name: string; typeArguments: TypeNodeBase<T>[] }
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
    | { _type: "union"; members: TypeNodeBase<T>[] }
    | { _type: "intersection"; members: TypeNodeBase<T>[] }
    | {
        _type: "conditionalType";
        checkType: TypeNodeBase<T>;
        extendsType: TypeNodeBase<T>;
        thenType: TypeNodeBase<T>;
        elseType: TypeNodeBase<T>;
      }
    | {
        _type: "infer";
        name: string;
      }
    | {
        _type: "rest";
        type: TypeNodeBase<T>;
      }
    | {
        _type: "mappedType";
        keyName: string;
        constraint: TypeNodeBase<T>;
        remapping?: TypeNodeBase<T>;
        type: TypeNodeBase<T>;
      }
    | {
        _type: "indexedAccessType";
        indexType: TypeNodeBase<T>;
        objectType: TypeNodeBase<T>;
      }
    | {
        _type: "keyof";
        type: TypeNodeBase<T>;
      }
  );

export type TypeNode = TypeNodeBase<{ text: () => string; nodeId: NodeId }>;
export type TypeNodeWithoutId = TypeNodeBase<{ text: () => string }>;

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

const keyofKeyword = (type: TypeNode): TypeNode => ({
  _type: "keyof",
  type,
  text: () => `keyof ${type.text()}`,
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

const objectType = (
  properties: [key: TypeNode, value: TypeNode][]
): TypeNode => ({
  _type: "object",
  properties,
  nodeId: uuid(),
  text: () => `{
    ${properties.map(([key, value]) => `${key}: ${value.text()}`)}
    }`,
});

const mappedType = (
  keyName: string,
  constraint: TypeNode,
  remapping: TypeNode | undefined,
  type: TypeNode
): TypeNode => ({
  _type: "mappedType",
  keyName,
  constraint,
  remapping,
  type,
  text: () => `{
    [${keyName} in ${constraint.text()}${
      remapping ? "as " + remapping.text() : ""
    }]: ${type.text()}
  }`,
  nodeId: uuid(),
});

const indexedAccessType = (
  objectType: TypeNode,
  indexType: TypeNode
): TypeNode => ({
  _type: "indexedAccessType",
  nodeId: uuid(),
  indexType,
  objectType,
  text: () => `${objectType.text()}[${indexType.text()}]`,
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
  object: objectType,
  mappedType,
  indexedAccessType,
  keyof: keyofKeyword,
};

export const mapType = (
  type: TypeNode,
  f: (t: TypeNode) => TypeNode
): TypeNode =>
  match(type)
    .with(
      {
        _type: P.union(
          "string",
          "number",
          "boolean",
          "undefined",
          "numberLiteral",
          "stringLiteral",
          "booleanLiteral",
          "null",
          "void",
          "any",
          "unknown",
          "never",
          "infer"
        ),
      },
      (t) => f(t)
    )
    .with({ _type: "tuple" }, (type) => {
      const elements = type.elements.map((el) => mapType(el, f));
      return f({
        ...type,
        elements,
      });
    })
    .with({ _type: "object" }, (type) => {
      const properties = type.properties.map(([k, val]) => {
        const newKey = mapType(k, f);
        const newVal = mapType(val, f);
        return [newKey, newVal];
      }) as [TypeNode, TypeNode][];
      return f({
        ...type,
        properties,
      });
    })
    .with({ _type: "array" }, (type) =>
      f({
        ...type,
        elementType: mapType(type.elementType, f),
      })
    )
    .with({ _type: "typeReference" }, (type) => {
      if (type.typeArguments.length === 0) {
        return f(type);
      } else {
        const typeArguments = type.typeArguments.map((a) => mapType(a, f));
        return f({
          ...type,
          typeArguments,
        });
      }
    })
    .with({ _type: "union" }, (type) => {
      const members = type.members.map((m) => mapType(m, f));
      return f({
        ...type,
        members,
      });
    })
    .with({ _type: "intersection" }, (type) => {
      const members = type.members.map((m) => mapType(m, f));
      return f({
        ...type,
        members,
      });
    })
    .with({ _type: "conditionalType" }, (type) => {
      const checkType = mapType(type.checkType, f);
      const extendsType = mapType(type.extendsType, f);
      const thenType = mapType(type.thenType, f);
      const elseType = mapType(type.elseType, f);

      return f({
        ...type,
        checkType,
        extendsType,
        thenType,
        elseType,
      });
    })
    .with({ _type: "rest" }, (type) =>
      f({
        ...type,
        type: mapType(type.type, f),
      })
    )
    .with({ _type: "typeDeclaration" }, (type) => {
      const { type: t } = type;
      return f({
        ...type,
        type: mapType(t, f),
      });
    })
    .with({ _type: "mappedType" }, (type) => {
      const constraint = mapType(type.constraint, f);
      const remapping = type.remapping ? mapType(type.remapping, f) : undefined;
      const type_ = mapType(type.type, f);

      return f({
        ...type,
        constraint,
        remapping,
        type: type_,
      });
    })
    .with({ _type: "indexedAccessType" }, (type) => {
      const indexType = mapType(type.indexType, f);
      const objectType = mapType(type.objectType, f);

      return f({
        ...type,
        indexType,
        objectType,
      });
    })
    .with({ _type: "keyof" }, (type) => {
      const type_ = mapType(type.type, f);

      return f({
        ...type,
        type: type_,
      });
    })
    .exhaustive();

export const traverse = (type: TypeNode, f: (t: TypeNode) => void) => {
  mapType(type, (tt) => {
    f(tt);
    return tt;
  });
};

export const replaceTypeReference = (
  type: TypeNode,
  typeVariableName: string,
  newType: TypeNode
) =>
  mapType(type, (t) =>
    match(t)
      .when(
        (t) => t._type === "typeReference" && t.name === typeVariableName,
        () => newType
      )
      .otherwise(() => t)
  );

export const withoutNodeIds = (type: TypeNode): TypeNodeWithoutId => {
  const res = mapType(type, (t) => {
    const { nodeId, ...rest } = t;
    return rest as any;
  });

  return res;
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

export const printTypeNode = (t: TypeNode): string =>
  match(t)
    .with(
      {
        _type: P.union(
          "string",
          "number",
          "boolean",
          "undefined",
          "numberLiteral",
          "stringLiteral",
          "booleanLiteral",
          "null",
          "void",
          "any",
          "unknown",
          "never"
        ),
      },
      (t) => t.text()
    )
    .with(
      { _type: "tuple" },
      (t) => `[${t.elements.map(printTypeNode).join(", ")}]`
    )
    .with(
      { _type: "object" },
      (t) =>
        `{${t.properties.map(
          ([key, value]) => `\t[${printTypeNode(key)}]: ${printTypeNode(value)}`
        )}}`
    )
    .with({ _type: "array" }, (t) => `${printTypeNode(t.elementType)}[]`)
    .with(
      { _type: "typeReference" },
      (t) =>
        `${t.name}${
          t.typeArguments.length > 0
            ? "<" + t.typeArguments.map(printTypeNode).join(", ") + ">"
            : ""
        }`
    )
    .with({ _type: "union" }, (t) => t.members.map(printTypeNode).join(" | "))
    .with({ _type: "intersection" }, (t) =>
      t.members.map(printTypeNode).join(" & ")
    )
    .with(
      { _type: "conditionalType" },
      (t) =>
        `${printTypeNode(t.checkType)} extends ${printTypeNode(
          t.extendsType
        )} ? ${printTypeNode(t.thenType)} : ${printTypeNode(t.elseType)}`
    )
    .with({ _type: "rest" }, (t) => `...${printTypeNode(t.type)}`)
    .with({ _type: "infer" }, (t) => `infer ${t.name}`)
    .with(
      { _type: "typeDeclaration" },
      (t) => `type ${t.name} = ${printTypeNode(t.type)}`
    )
    .with(
      { _type: "mappedType" },
      (t) =>
        `{
        [${t.keyName} in ${printTypeNode(t.constraint)}${
          t.remapping ? "as " + printTypeNode(t.remapping) : ""
        }]: ${printTypeNode(t.type)}
      }`
    )
    .with(
      { _type: "indexedAccessType" },
      (t) => `${printTypeNode(t.objectType)}[${printTypeNode(t.indexType)}]`
    )
    .with({ _type: "keyof" }, (t) => `keyof ${printTypeNode(t.type)}`)
    .exhaustive();

export const deepEquals = (t1: TypeNode, t2: TypeNode): boolean =>
  JSON.stringify(withoutNodeIds(t1)) === JSON.stringify(withoutNodeIds(t2));
