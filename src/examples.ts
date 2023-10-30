import { TYPE_TO_EVAL_IDENTIFIER } from "./interpreter/type-node/create-type-to-eval";

export const EXAMPLES = [
  {
    name: "LastRecursive",
    envSource: `type Last<T extends any[]> 
  = T extends [infer L] 
    ? L 
    : T extends [infer _, ...infer Rest] ? Last<Rest> : never;`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Last<[1, 2, 3]>;`,
  },
  {
    name: "Concat",
    envSource: "type Concat<A extends any[], B extends any[]> = [...A, ...B];",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Concat<[1, 2], Concat<[3, 4], [1, 2, 3]>>;`,
  },
  {
    name: "Omit",
    envSource: `type Todo = {
  title: string;
  description: string;
  completed: boolean;
}
`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Omit<Todo, "title" | "completed">`,
  },
  {
    name: "keyof",
    envSource: "// no environment is needed for this example",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = keyof { a: 1, b: 2, c: 3}`,
  },
  {
    name: "Pick",
    envSource: `type Todo = {
  title: string;
  description: string;
  completed: boolean;
}`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Pick<Todo, "title" | "completed">`,
  },
  {
    name: "Mapped types",
    envSource: "// no environment is needed for this example",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = {
  [k in "a" | "b" as Uppercase<k>]: k
};`,
  },
  {
    name: "Distributed union types",
    envSource: `type ToTuple<T1, T2> = T1 extends any ? 
  T2 extends any 
    ? [T1, T2]
    : never
  : never;`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = ToTuple<string | number, 1 | 2>`,
  },
  {
    name: "Intrinsic types",
    envSource: "// no environment is needed for this example",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Uppercase<"hello"> | Lowercase<"HowDY"> | Capitalize<"hey"> | Uncapitalize<"Hey">`,
  },
  {
    name: "Simplify union",
    envSource: "type constNever<T> = never;",
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = 42 | 'hello' | 'hello' | never | constNever<42>`,
  },
  {
    name: "Reverse",
    envSource: `type Reverse<T extends any[]> 
  = T extends [infer Head, ...infer Tail]
    ? [...Reverse<Tail>, Head] 
    : [];`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Reverse<[1, 2, 3]>;`,
  },
];
