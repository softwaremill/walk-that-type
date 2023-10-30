import { TYPE_TO_EVAL_IDENTIFIER } from "./interpreter/type-node/create-type-to-eval";

export const EXAMPLES = [
  {
    name: "Omit",
    envSource: `
    type Todo = {
      title: string;
      description: string;
      completed: boolean;
    }
     `,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Omit<Todo, "title" | "completed">`,
  },
  {
    name: "keyof",
    envSource: "",
    typeSource: `keyof { a: 1, b: 2, c: 3}`,
  },
  {
    name: "Pick",
    envSource: `
    type Todo {
      title: string;
      description: string;
      completed: boolean;
    }
     `,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Pick<Todo, "title" | "completed">`,
  },
  {
    name: "Indexed access types",
    envSource: "",
    typeSource: `{
    a: 1,
    b: 2,
    c: 3
  }["b"]`,
  },
  {
    name: "Indexed access types2",
    envSource: "",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = [1, 2, 3][2]`,
  },
  {
    name: "Mapped types",
    envSource: "",
    typeSource: `{
      [k in "a" | "b" as Uppercase<k>]: k
    };`,
  },
  {
    name: "Distributed union types",
    envSource: `type ToArray<T1, T2> = T1 extends any ? 
    T2 extends any 
        ? [T1, T2]
        : never
    : never;`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = ToArray<string | number, 1 | 2>`,
  },
  {
    name: "Intrinsic types",
    envSource: "",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Uppercase<"hello"> | Lowercase<"HowDY"> | Capitalize<"hey"> | Uncapitalize<"Hey">`,
  },
  {
    name: "Object type",
    envSource: "",
    typeSource: `{
      a: 42,
      b: {
        c: 123,
        d: true | false
      }
    }`,
  },
  {
    name: "Simplify union",
    envSource: "type constNever<T> = never;",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = 42 | 'hello' | 'hello' | never | constNever<42>`,
  },
  {
    name: "Reverse",
    envSource:
      "type Reverse<T extends any[]> = T extends [infer Head, ...infer Tail] ? [...Reverse<Tail>, Head] : [];",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Reverse<[1, 2, 3]>;`,
  },
  {
    name: "EvalTrace test",
    envSource: "type Concat<A extends any[], B extends any[]> = [...A, ...B];",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = [Concat<[1], [2]>, Concat<[3], [4]>];`,
  },
  {
    name: "Concat",
    envSource: "type Concat<A extends any[], B extends any[]> = [...A, ...B];",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Concat<[1, 2], Concat<[3, 4], [1, 2, 3]>>;`,
  },
  {
    name: "LastRecursive",
    envSource:
      "type Last<T extends any[]> = T extends [infer L] ? L : T extends [infer _, ...infer Rest] ? Last<Rest> : never;",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Last<[1, 2, 3]>;`,
  },
  {
    name: "LastRecursive in tuple",
    envSource:
      "type Last<T extends any[]> = T extends [infer L] ? L : T extends [infer _, ...infer Rest] ? Last<Rest> : never;",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = [Last<[1, 2]>];`,
  },
];
