import { Result, err, ok } from "this-is-ok/result";
import { T, TypeNode } from "../type-node";

type IntrinsicTypeFn = (args: TypeNode[]) => Result<TypeNode, Error>;
export type IntrinsicTypes = Record<
  string,
  undefined | { fn: IntrinsicTypeFn; docsUrl: string }
>;

const uppercase: IntrinsicTypeFn = (args) => {
  if (args.length !== 1) {
    return err(new Error("Uppercase expects 1 argument"));
  }

  const arg = args[0];

  if (arg._type !== "stringLiteral") {
    return err(new Error("Uppercase expects a string literal"));
  }

  return ok(T.stringLit(arg.value.toLocaleUpperCase()));
};

const lowercase: IntrinsicTypeFn = (args) => {
  if (args.length !== 1) {
    return err(new Error("Lowercase expects 1 argument"));
  }

  const arg = args[0];

  if (arg._type !== "stringLiteral") {
    return err(new Error("Lowercase expects a string literal"));
  }

  return ok(T.stringLit(arg.value.toLocaleLowerCase()));
};

const capitalize: IntrinsicTypeFn = (args) => {
  if (args.length !== 1) {
    return err(new Error("Capitalize expects 1 argument"));
  }

  const arg = args[0];

  if (arg._type !== "stringLiteral") {
    return err(new Error("Capitalize expects a string literal"));
  }

  return ok(
    T.stringLit(arg.value.charAt(0).toUpperCase() + arg.value.slice(1))
  );
};

const uncapitalize: IntrinsicTypeFn = (args) => {
  if (args.length !== 1) {
    return err(new Error("uppercase expects 1 argument"));
  }

  const arg = args[0];

  if (arg._type !== "stringLiteral") {
    return err(new Error("Uppercase expects a string literal"));
  }

  return ok(
    T.stringLit(arg.value.charAt(0).toLowerCase() + arg.value.slice(1))
  );
};

export const intrinsicTypes: IntrinsicTypes = {
  Uppercase: {
    fn: uppercase,
    docsUrl:
      "https://www.typescriptlang.org/docs/handbook/utility-types.html#uppercasestringtype",
  },
  Lowercase: {
    fn: lowercase,
    docsUrl:
      "https://www.typescriptlang.org/docs/handbook/utility-types.html#lowercasestringtype",
  },
  Capitalize: {
    fn: capitalize,
    docsUrl:
      "https://www.typescriptlang.org/docs/handbook/utility-types.html#capitalizestringtype",
  },
  Uncapitalize: {
    fn: uncapitalize,
    docsUrl:
      "https://www.typescriptlang.org/docs/handbook/utility-types.html#uncapitalizestringtype",
  },
};
