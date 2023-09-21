// https://stackoverflow.com/a/65025697/17957664
type MapCartesian<T extends any[][]> = {
  [P in keyof T]: T[P] extends Array<infer U> ? U : never;
};
export const cartesianProduct = <T extends any[][]>(
  ...arr: T
): MapCartesian<T>[] =>
  arr.reduce(
    (a, b) => a.flatMap((c) => b.map((d) => [...c, d])),
    [[]]
  ) as MapCartesian<T>[];
