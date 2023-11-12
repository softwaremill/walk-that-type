import { TYPE_TO_EVAL_IDENTIFIER } from "./interpreter/type-node/create-type-to-eval";

type Example = {
  name: string;
  envSource: string;
  typeSource: string;
};

export const EXAMPLES = [
  {
    name: "Tuple to Object",
    envSource: `type TupleToObject<T extends readonly (string | number)[]> = {
  [k in T[number]]: k;
};`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = TupleToObject<[1, 2, 3]>;`,
  },
  {
    name: "Pick",
    envSource: `type MyPick<T, K extends keyof T> = {
  [key in Extract<keyof T, K>]: T[key];
};
    
type Todo = {
  title: string;
  description: string;
  completed: boolean;
}`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = MyPick<Todo, "title" | "completed">;`,
  },
  {
    name: "First of Array",
    envSource: `// Implement a generic First<T> that takes an Array T and returns its first element's type.
type First<T extends any[]> = T extends [infer Head, ...any] ? Head : never;`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = First<[1, 2, 3]>;`,
  },
  {
    name: "Length of Array",
    envSource: `// For given a tuple, you need create a generic Length, pick the length of the tuple
type Length<T extends readonly any[]> = T["length"];`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Length<["h", "e", "l", "l", "o"]>;`,
  },
  {
    name: "If",
    envSource: `//Implement the util type If<C, T, F> which accepts condition C, a truthy value T, and a falsy value F. 
// C is expected to be either true or false while T and F can be any type.
type If<C extends boolean, T, F> = C extends true ? T : F;`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = If<true, "a", "b">;`,
  },
  {
    name: "Concat",
    envSource: `// Implement the JavaScript Array.concat function in the type system. A type takes the two arguments. 
// The output should be a new array that includes inputs in ltr order
type Concat<T extends any[], U extends any[]> = [...T, ...U];`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Concat<[1, 2], [3, 4]>;`,
  },
  {
    name: "Push",
    envSource: `// Implement the generic version of Array.push
type Push<T extends any[], U> = [...T, U];`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Push<[1, 2], 3>;`,
  },
  {
    name: "Unshift",
    envSource: `// Implement the type version of Array.unshift
type Unshift<T extends any[], U> = [U, ...T];`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Unshift<[1, 2], 0>;`,
  },
  {
    name: "Tuple to Union",
    envSource: `//  Implement a generic TupleToUnion<T> which covers the values of a tuple to its values union.
type TupleToUnion<T extends any[]> = T[number];`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = TupleToUnion<['a', 'b', 'c', 'd']>`,
  },
  {
    name: "Last of Array",
    envSource: `// Implement a generic Last<T> that takes an Array T and returns its last element.
type Last<T extends any[]> = T extends [...any, infer last] ? last : never;`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Last<['a', 'b', 'c', 'd']>`,
  },
  {
    name: "Pop",
    envSource: `// Implement a generic Pop<T> that takes an Array T and returns an Array without it's last element.
type Pop<T extends any[]> = T extends [...infer inits, any] ? inits : [];`,
    typeSource: `type ${TYPE_TO_EVAL_IDENTIFIER} = Pop<['a', 'b', 'c', 'd']>`,
  },
] satisfies Example[];
