# TODOs:

- [x] format displayed code
- [x] primitive types
- [x] spread operator for tuples (eg. used for concat)
- [ ] infer
  - [x] tuples
  - [ ] objects
  - [ ] functions
- [ ] object types
- [x] union types
- [ ] distributed union
- [ ] intersection types
- [ ] function types
- [ ] type variance
- [ ] readonly
- [ ] template string literals
- [ ] mapped types
- [ ] built-in types
  - [ ] Partial
  - [ ] Uppercase
  - [ ] Lowercase
  - [ ] Capitalize
  - [ ] Uncapitalize
  - [ ] Extract
  - [ ] Exclude
  - [ ] Pick
  - [ ] Omit
  - [ ] Awaited
- [] extends
  - [x] any, unknown, never
  - [x] common sets such as number, string
  - [x] literal types
  - [ ] objects
  - [x] union types
  - [ ] intersection types
- [x] conditional types
- [ ] Test it with easy type challenges

# Implementing new features:

- Make sure `mapASTToTypeNodes` handles parsing syntax for this feature, if not, add it. This
  requires adding a new `TypeNode` variant. Fill missing cases in functions that use `TypeNode` (use
  `pnpm check:types` to find all these places).
- Add tests and implement `evalT` for this feature.
- Add tests and implement `extendsT` for this feature.
- Add traverse logic in `traverse` function.
- In `eval-tree.ts` add new cases in `calculateNextStep` and `chooseNodeToEval`.
- Finally, update `EvalDescription` component.
